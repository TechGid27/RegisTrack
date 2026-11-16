using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Doctrack_backend_api.Services;

public sealed class PayMongoService
{
    private const string ApiUrl = "https://api.paymongo.com/v2/checkout_sessions";
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly IHostEnvironment _environment;

    public PayMongoService(HttpClient httpClient, IConfiguration configuration, IHostEnvironment environment)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _environment = environment;
    }

    public async Task<PayMongoCheckoutSession> CreateCheckoutSessionAsync(
        string referenceNumber,
        string documentName,
        long unitAmountCentavos,
        int quantity,
        string successUrl,
        string cancelUrl,
        CancellationToken cancellationToken)
    {
        var payload = new
        {
            data = new
            {
                attributes = new
                {
                    line_items = new[]
                    {
                        new
                        {
                            name = documentName,
                            amount = unitAmountCentavos,
                            currency = "PHP",
                            quantity
                        }
                    },
                    payment_method_types = new[] { "qrph" },
                    success_url = successUrl,
                    cancel_url = cancelUrl,
                    reference_number = referenceNumber
                }
            }
        };

        using var response = await SendAsync(HttpMethod.Post, ApiUrl, payload, cancellationToken);
        using var document = await ReadResponseAsync(response, cancellationToken);
        var data = document.RootElement.GetProperty("data");
        var attributes = data.GetProperty("attributes");
        return new PayMongoCheckoutSession(
            data.GetProperty("id").GetString() ?? throw new PayMongoIntegrationException("PayMongo did not return a checkout session ID."),
            attributes.GetProperty("checkout_url").GetString() ?? throw new PayMongoIntegrationException("PayMongo did not return a checkout URL."));
    }

    public async Task<bool> IsCheckoutSessionPaidAsync(
        string sessionId,
        string expectedReferenceNumber,
        CancellationToken cancellationToken)
    {
        var url = $"{ApiUrl}/{Uri.EscapeDataString(sessionId)}";
        using var response = await SendAsync(HttpMethod.Get, url, null, cancellationToken);
        using var document = await ReadResponseAsync(response, cancellationToken);
        var attributes = document.RootElement.GetProperty("data").GetProperty("attributes");
        var referenceNumber = attributes.GetProperty("reference_number").GetString();
        if (!string.Equals(referenceNumber, expectedReferenceNumber, StringComparison.Ordinal))
            throw new PayMongoIntegrationException("PayMongo checkout reference does not match the document request.");

        if (!attributes.TryGetProperty("payments", out var payments) || payments.ValueKind != JsonValueKind.Array)
            return false;

        return payments.EnumerateArray().Any(payment =>
            payment.TryGetProperty("attributes", out var paymentAttributes) &&
            paymentAttributes.TryGetProperty("status", out var status) &&
            string.Equals(status.GetString(), "paid", StringComparison.OrdinalIgnoreCase));
    }

    private async Task<HttpResponseMessage> SendAsync(
        HttpMethod method,
        string url,
        object? payload,
        CancellationToken cancellationToken)
    {
        var secretKey = _configuration["PayMongo:SecretKey"];
        if (string.IsNullOrWhiteSpace(secretKey))
            throw new PayMongoIntegrationException("PayMongo is not configured. Set PayMongo:SecretKey using local user secrets or an environment variable.");

        if (_environment.IsDevelopment() && !secretKey.StartsWith("sk_test_", StringComparison.Ordinal))
            throw new PayMongoIntegrationException("Development must use a PayMongo test secret key (sk_test_...).");

        using var request = new HttpRequestMessage(method, url);
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{secretKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        if (payload != null)
            request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        try
        {
            return await _httpClient.SendAsync(request, cancellationToken);
        }
        catch (HttpRequestException exception)
        {
            throw new PayMongoIntegrationException("Unable to connect to PayMongo.", exception);
        }
        catch (TaskCanceledException exception) when (!cancellationToken.IsCancellationRequested)
        {
            throw new PayMongoIntegrationException("The PayMongo request timed out.", exception);
        }
    }

    private static async Task<JsonDocument> ReadResponseAsync(
        HttpResponseMessage response,
        CancellationToken cancellationToken)
    {
        var body = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            var message = "PayMongo rejected the checkout request.";
            try
            {
                using var error = JsonDocument.Parse(body);
                var errors = error.RootElement.GetProperty("errors");
                if (errors.ValueKind == JsonValueKind.Array && errors.GetArrayLength() > 0 &&
                    errors[0].TryGetProperty("detail", out var detail))
                    message = detail.GetString() ?? message;
            }
            catch (JsonException)
            {
                message = "PayMongo returned an unreadable error response.";
            }

            throw new PayMongoIntegrationException(message);
        }

        try
        {
            return JsonDocument.Parse(body);
        }
        catch (JsonException exception)
        {
            throw new PayMongoIntegrationException("PayMongo returned an invalid response.", exception);
        }
    }
}

public sealed record PayMongoCheckoutSession(string Id, string CheckoutUrl);

public sealed class PayMongoIntegrationException : Exception
{
    public PayMongoIntegrationException(string message) : base(message) { }
    public PayMongoIntegrationException(string message, Exception innerException) : base(message, innerException) { }
}
