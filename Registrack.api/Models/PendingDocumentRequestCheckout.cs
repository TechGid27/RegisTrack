using System.ComponentModel.DataAnnotations;

namespace Doctrack_backend_api.Models;

public class PendingDocumentRequestCheckout
{
    public int Id { get; set; }

    [Required]
    [StringLength(50)]
    public string ReferenceNumber { get; set; } = string.Empty;

    [Required]
    public int UserId { get; set; }

    [Required]
    public int DocumentTypeId { get; set; }

    [Required]
    [StringLength(1000)]
    public string Purpose { get; set; } = string.Empty;

    [Range(1, 100)]
    public int Quantity { get; set; }

    [StringLength(2000)]
    public string Notes { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string DeliveryMethod { get; set; } = string.Empty;

    [Required]
    [StringLength(20)]
    public string PaymentMethod { get; set; } = "PayMongo";

    [Required]
    [StringLength(20)]
    public string PaymentStatus { get; set; } = "Pending";

    public decimal Amount { get; set; }

    [StringLength(100)]
    public string? PayMongoCheckoutSessionId { get; set; }

    [StringLength(500)]
    public string? PayMongoCheckoutUrl { get; set; }

    public int? DocumentRequestId { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
