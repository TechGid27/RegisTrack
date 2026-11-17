using System.Data;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Doctrack_backend_api.Data;
using Doctrack_backend_api.Hubs;
using Doctrack_backend_api.Models;
using Doctrack_backend_api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;

namespace Doctrack_backend_api.Controllers;

[ApiController]
[Route("api/webhooks/paymongo")]
[AllowAnonymous]
public class PayMongoWebhookController(
    ApplicationDbContext context,
    IConfiguration configuration,
    ILogger<PayMongoWebhookController> logger,
    IEmailService emailService,
    IHubContext<RequestHub> hubContext) : ControllerBase
{
    [HttpPost]
    [RequestSizeLimit(1024 * 1024)]
    public async Task<IActionResult> Receive(CancellationToken cancellationToken)
    {
        using var reader = new StreamReader(Request.Body);
        var body = await reader.ReadToEndAsync(cancellationToken);
        var signature = Request.Headers["Paymongo-Signature"].ToString();
        if (!IsValidSignature(body, signature))
        {
            logger.LogWarning("Rejected PayMongo webhook because its signature is invalid or missing");
            return Unauthorized();
        }

        JsonDocument json;
        try
        {
            json = JsonDocument.Parse(body);
        }
        catch (JsonException)
        {
            return BadRequest(new { message = "Invalid webhook JSON" });
        }

        using (json)
        {
            var root = json.RootElement;
            if (root.ValueKind != JsonValueKind.Object ||
                !root.TryGetProperty("data", out var eventData) ||
                eventData.ValueKind != JsonValueKind.Object)
            {
                return Ok();
            }

            JsonElement session;
            if (eventData.TryGetProperty("attributes", out var eventAttributes) &&
                eventAttributes.ValueKind == JsonValueKind.Object &&
                eventAttributes.TryGetProperty("type", out var nestedEventType) &&
                nestedEventType.ValueKind == JsonValueKind.String)
            {
                if (nestedEventType.GetString() != "checkout_session.payment.paid")
                    return Ok();

                if (!eventAttributes.TryGetProperty("data", out session))
                    return BadRequest(new { message = "Webhook is missing checkout payment details" });
            }
            else
            {
                if (!eventData.TryGetProperty("type", out var eventType) ||
                    eventType.ValueKind != JsonValueKind.String ||
                    eventType.GetString() != "checkout_session.payment.paid")
                {
                    return Ok();
                }

                if (!eventData.TryGetProperty("data", out session))
                    return BadRequest(new { message = "Webhook is missing checkout payment details" });
            }

            if (session.ValueKind != JsonValueKind.Object ||
                !session.TryGetProperty("id", out var sessionIdElement) ||
                !session.TryGetProperty("attributes", out var attributes) ||
                !attributes.TryGetProperty("reference_number", out var referenceElement) ||
                !attributes.TryGetProperty("payments", out var payments) ||
                payments.ValueKind != JsonValueKind.Array)
            {
                return BadRequest(new { message = "Webhook is missing checkout payment details" });
            }

            var sessionId = sessionIdElement.GetString();
            var referenceNumber = referenceElement.GetString();
            if (string.IsNullOrWhiteSpace(sessionId) || string.IsNullOrWhiteSpace(referenceNumber))
                return BadRequest(new { message = "Webhook checkout identifiers are invalid" });

            await using var transaction = await context.Database.BeginTransactionAsync(
                IsolationLevel.Serializable, cancellationToken);

            var pending = await context.PendingDocumentRequestCheckouts
                .FirstOrDefaultAsync(
                    checkout => checkout.PayMongoCheckoutSessionId == sessionId &&
                                checkout.ReferenceNumber == referenceNumber,
                    cancellationToken);
            if (pending == null)
            {
                logger.LogWarning("PayMongo webhook received for unknown checkout {SessionId}", sessionId);
                return NotFound();
            }

            if (pending.DocumentRequestId.HasValue)
                return Ok();

            if (!HasMatchingPaidPayment(payments, pending.Amount))
            {
                logger.LogWarning("PayMongo webhook payment did not match checkout {SessionId}", sessionId);
                return BadRequest(new { message = "Paid amount does not match the pending checkout" });
            }

            var request = new DocumentRequest
            {
                ReferenceNumber = pending.ReferenceNumber,
                UserId = pending.UserId,
                DocumentTypeId = pending.DocumentTypeId,
                Purpose = pending.Purpose,
                Quantity = pending.Quantity,
                Notes = pending.Notes,
                DeliveryMethod = pending.DeliveryMethod,
                PaymentMethod = "PayMongo",
                PaymentStatus = "Paid",
                PaymentAmount = pending.Amount,
                PayMongoCheckoutSessionId = pending.PayMongoCheckoutSessionId,
                PayMongoCheckoutUrl = pending.PayMongoCheckoutUrl,
                Status = "Request",
                RequestDate = DateTime.UtcNow
            };

            pending.PaymentStatus = "Paid";
            context.DocumentRequests.Add(request);
            await context.SaveChangesAsync(cancellationToken);

            pending.DocumentRequestId = request.Id;
            await context.SaveChangesAsync(cancellationToken);
            await transaction.CommitAsync(cancellationToken);

            var user = await context.Users.FindAsync([request.UserId], cancellationToken);
            var documentType = await context.DocumentTypes.FindAsync([request.DocumentTypeId], cancellationToken);
            if (user == null || documentType == null)
            {
                logger.LogError(
                    "Paid checkout {SessionId} created request {RequestId}, but related notification data is missing",
                    sessionId, request.Id);
                return Ok();
            }

            emailService.QueueRequestConfirmationEmail(
                user.Email, $"{user.FirstName} {user.LastName}",
                request.ReferenceNumber, documentType.Name);

            await hubContext.Clients.Group("admins").SendAsync("NewRequest", new
            {
                id = request.Id,
                referenceNumber = request.ReferenceNumber,
                userName = $"{user.FirstName} {user.LastName}",
                documentType = documentType.Name,
                requestDate = request.RequestDate
            }, cancellationToken);

            await hubContext.Clients.Group($"user_{request.UserId}").SendAsync("RequestUpdated", new
            {
                id = request.Id,
                referenceNumber = request.ReferenceNumber,
                status = request.Status,
                paymentMethod = request.PaymentMethod,
                paymentStatus = request.PaymentStatus,
                paymentAmount = request.PaymentAmount,
                updatedAt = request.RequestDate
            }, cancellationToken);

            return Ok();
        }
    }

    private bool IsValidSignature(string body, string signatureHeader)
    {
        var webhookSecret = configuration["PayMongo:WebhookSecret"];
        var secretKey = configuration["PayMongo:SecretKey"];
        if (string.IsNullOrWhiteSpace(webhookSecret) || string.IsNullOrWhiteSpace(secretKey))
        {
            logger.LogError("PayMongo webhook secrets are not configured");
            return false;
        }

        var signatureParts = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var part in signatureHeader.Split(','))
        {
            var pair = part.Split('=', 2);
            if (pair.Length != 2 || !signatureParts.TryAdd(pair[0].Trim(), pair[1].Trim()))
                return false;
        }

        var mode = secretKey.StartsWith("sk_live_", StringComparison.Ordinal) ? "li" :
            secretKey.StartsWith("sk_test_", StringComparison.Ordinal) ? "te" : null;
        if (mode == null)
            return false;
        if (!signatureParts.TryGetValue("t", out var timestamp) ||
            !signatureParts.TryGetValue(mode, out var suppliedSignature))
        {
            return false;
        }

        using var hmac = new HMACSHA256(Encoding.UTF8.GetBytes(webhookSecret));
        var signedPayload = Encoding.UTF8.GetBytes($"{timestamp}.{body}");
        var expectedSignature = Convert.ToHexString(hmac.ComputeHash(signedPayload));
        var expectedBytes = Encoding.ASCII.GetBytes(expectedSignature);
        var suppliedBytes = Encoding.ASCII.GetBytes(suppliedSignature.ToUpperInvariant());

        return expectedBytes.Length == suppliedBytes.Length &&
               CryptographicOperations.FixedTimeEquals(expectedBytes, suppliedBytes);
    }

    private static bool HasMatchingPaidPayment(JsonElement payments, decimal expectedAmount)
    {
        var expectedCentavos = expectedAmount * 100;
        foreach (var payment in payments.EnumerateArray())
        {
            if (!payment.TryGetProperty("attributes", out var paymentAttributes) ||
                !paymentAttributes.TryGetProperty("status", out var status) ||
                status.GetString() != "paid" ||
                !paymentAttributes.TryGetProperty("currency", out var currency) ||
                currency.GetString() != "PHP" ||
                !paymentAttributes.TryGetProperty("amount", out var amount) ||
                !amount.TryGetInt64(out var paidCentavos))
            {
                continue;
            }

            if (paidCentavos == expectedCentavos)
                return true;
        }

        return false;
    }
}
