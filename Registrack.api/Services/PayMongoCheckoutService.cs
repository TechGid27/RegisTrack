using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

namespace Doctrack_backend_api.Services;

public sealed record PayMongoCheckoutResult(string SessionId, string CheckoutUrl);

public class PayMongoCheckoutService(HttpClient httpClient, IConfiguration configuration)
{
    public async Task<PayMongoCheckoutResult> CreateCheckoutAsync(
        string referenceNumber,
        string documentTypeName,
        int quantity,
        long amountInCentavos,
        string customerEmail,
        CancellationToken cancellationToken)
    {
        var secretKey = configuration["PayMongo:SecretKey"];
        var successUrl = configuration["PayMongo:SuccessUrl"];
        var cancelUrl = configuration["PayMongo:CancelUrl"];
        if (string.IsNullOrWhiteSpace(secretKey) ||
            string.IsNullOrWhiteSpace(successUrl) ||
            string.IsNullOrWhiteSpace(cancelUrl))
        {
            throw new InvalidOperationException(
                "PayMongo:SecretKey, PayMongo:SuccessUrl, and PayMongo:CancelUrl must be configured.");
        }

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
                            name = documentTypeName,
                            amount = amountInCentavos / quantity,
                            currency = "PHP",
                            quantity
                        }
                    },
                    payment_method_types = new[] { "card", "gcash", "qrph" },
                    success_url = successUrl,
                    cancel_url = cancelUrl,
                    reference_number = referenceNumber,
                    send_email_receipt = true,
                    billing = new { email = customerEmail },
                    metadata = new { request_reference = referenceNumber }
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, "https://api.paymongo.com/v2/checkout_sessions");
        var credentials = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{secretKey}:"));
        request.Headers.Authorization = new AuthenticationHeaderValue("Basic", credentials);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        using var response = await httpClient.SendAsync(request, cancellationToken);
        var responseBody = await response.Content.ReadAsStringAsync(cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            throw new HttpRequestException(
                $"PayMongo checkout creation failed with status {(int)response.StatusCode}.");
        }

        using var json = JsonDocument.Parse(responseBody);
        var data = json.RootElement.GetProperty("data");
        var sessionId = data.GetProperty("id").GetString();
        var checkoutUrl = data.GetProperty("attributes").GetProperty("checkout_url").GetString();
        if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(checkoutUrl))
        {
            throw new InvalidOperationException("PayMongo returned an incomplete checkout session.");
        }

        return new PayMongoCheckoutResult(sessionId, checkoutUrl);
    }
}
