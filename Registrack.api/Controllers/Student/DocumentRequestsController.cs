using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.SignalR;
using Doctrack_backend_api.Data;
using Doctrack_backend_api.Models;
using Doctrack_backend_api.DTOs;
using Doctrack_backend_api.Services;
using Doctrack_backend_api.Hubs;

namespace Doctrack_backend_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class DocumentRequestsController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<DocumentRequestsController> _logger;
    private readonly IEmailService _emailService;
    private readonly IHubContext<RequestHub> _hubContext;
    private readonly PayMongoCheckoutService _payMongoCheckoutService;

    public DocumentRequestsController(
        ApplicationDbContext context, 
        ILogger<DocumentRequestsController> logger, 
        IEmailService emailService,
        IHubContext<RequestHub> hubContext,
        PayMongoCheckoutService payMongoCheckoutService)
    {
        _context = context;
        _logger = logger;
        _emailService = emailService;
        _hubContext = hubContext;
        _payMongoCheckoutService = payMongoCheckoutService;
    }

    /// <summary>
    /// GET: api/DocumentRequests - Retrieve all document requests with filtering
    /// Staff and Admin can see all, Students see only their own
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<DocumentRequestResponseDto>>> GetDocumentRequests(
        [FromQuery] string? status = null,
        [FromQuery] int? userId = null,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        try
        {
            if (page < 1 || pageSize < 1 || pageSize > 100)
            {
                return BadRequest(new { message = "Invalid pagination parameters. Page must be >= 1 and pageSize between 1-100" });
            }

            var query = _context.DocumentRequests
                .Include(dr => dr.User)
                .Include(dr => dr.DocumentType)
                .AsQueryable();

            // Get current user role and ID from claims
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;

            // Students can only see their own requests
            if (userRole == "Student" && int.TryParse(currentUserId, out int studentId))
            {
                query = query.Where(dr => dr.UserId == studentId);
            }
            // Staff and Admin can see all requests

            if (!string.IsNullOrEmpty(status))
            {
                query = query.Where(dr => dr.Status == status);
            }

            if (userId.HasValue)
            {
                query = query.Where(dr => dr.UserId == userId.Value);
            }

            var totalCount = await query.CountAsync();
            var requests = await query
                .OrderByDescending(dr => dr.RequestDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(dr => new DocumentRequestResponseDto
                {
                    Id = dr.Id,
                    ReferenceNumber = dr.ReferenceNumber,
                    UserId = dr.UserId,
                    UserName = $"{dr.User.FirstName} {dr.User.LastName}",
                    UserEmail = dr.User.Email,
                    DocumentTypeId = dr.DocumentTypeId,
                    DocumentTypeName = dr.DocumentType.Name,
                    Status = dr.Status,
                    Quantity = dr.Quantity,
                    Purpose = dr.Purpose,
                    Notes = dr.Notes,
                    DeliveryMethod = dr.DeliveryMethod,
                    Address = userRole == "Admin" || userRole == "Staff" ? dr.DeliveryAddress : null,
                    PostalCode = userRole == "Admin" || userRole == "Staff" ? dr.PostalCode : null,
                    PaymentMethod = dr.PaymentMethod,
                    PaymentStatus = dr.PaymentStatus,
                    PaymentAmount = dr.PaymentAmount,
                    RequestDate = dr.RequestDate,
                    ProcessedDate = dr.ProcessedDate,
                    ApprovedDate = dr.ApprovedDate,
                    CompletedDate = dr.CompletedDate,
                    DocumentUrl = dr.DocumentUrl,
                    EmailSent = dr.EmailSent
                })
                .ToListAsync();

            Response.Headers.Append("X-Total-Count", totalCount.ToString());
            Response.Headers.Append("X-Page", page.ToString());
            Response.Headers.Append("X-Page-Size", pageSize.ToString());

            return Ok(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document requests");
            return StatusCode(500, new { message = "An error occurred while retrieving document requests" });
        }
    }

    /// <summary>
    /// GET: api/DocumentRequests/{id} - Retrieve a specific document request by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<DocumentRequestResponseDto>> GetDocumentRequest(int id)
    {
        try
        {
            var canViewAddress = User.IsInRole("Admin") || User.IsInRole("Staff");
            var request = await _context.DocumentRequests
                .Include(dr => dr.User)
                .Include(dr => dr.DocumentType)
                .Where(dr => dr.Id == id)
                .Select(dr => new DocumentRequestResponseDto
                {
                    Id = dr.Id,
                    ReferenceNumber = dr.ReferenceNumber,
                    UserId = dr.UserId,
                    UserName = $"{dr.User.FirstName} {dr.User.LastName}",
                    UserEmail = dr.User.Email,
                    DocumentTypeId = dr.DocumentTypeId,
                    DocumentTypeName = dr.DocumentType.Name,
                    Status = dr.Status,
                    Quantity = dr.Quantity,
                    Purpose = dr.Purpose,
                    Notes = dr.Notes,
                    DeliveryMethod = dr.DeliveryMethod,
                    Address = canViewAddress ? dr.DeliveryAddress : null,
                    PostalCode = canViewAddress ? dr.PostalCode : null,
                    PaymentMethod = dr.PaymentMethod,
                    PaymentStatus = dr.PaymentStatus,
                    PaymentAmount = dr.PaymentAmount,
                    RequestDate = dr.RequestDate,
                    ProcessedDate = dr.ProcessedDate,
                    ApprovedDate = dr.ApprovedDate,
                    CompletedDate = dr.CompletedDate,
                    DocumentUrl = dr.DocumentUrl,
                    EmailSent = dr.EmailSent
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound(new { message = $"Document request with ID {id} not found" });
            }

            return Ok(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document request {Id}", id);
            return StatusCode(500, new { message = "An error occurred while retrieving the document request" });
        }
    }

    /// <summary>
    /// GET: api/DocumentRequests/user/{userId} - Retrieve document requests for a specific user
    /// </summary>
    [HttpGet("user/{userId}")]
    [Authorize]
    public async Task<ActionResult<IEnumerable<DocumentRequestResponseDto>>> GetUserDocumentRequests(int userId)
    {
        try
        {
            var requests = await _context.DocumentRequests
                .Include(dr => dr.User)
                .Include(dr => dr.DocumentType)
                .Where(dr => dr.UserId == userId)
                .OrderByDescending(dr => dr.RequestDate)
                .Select(dr => new DocumentRequestResponseDto
                {
                    Id = dr.Id,
                    ReferenceNumber = dr.ReferenceNumber,
                    UserId = dr.UserId,
                    UserName = $"{dr.User.FirstName} {dr.User.LastName}",
                    UserEmail = dr.User.Email,
                    DocumentTypeId = dr.DocumentTypeId,
                    DocumentTypeName = dr.DocumentType.Name,
                    Status = dr.Status,
                    Quantity = dr.Quantity,
                    Purpose = dr.Purpose,
                    Notes = dr.Notes,
                    DeliveryMethod = dr.DeliveryMethod,
                    PaymentMethod = dr.PaymentMethod,
                    PaymentStatus = dr.PaymentStatus,
                    PaymentAmount = dr.PaymentAmount,
                    RequestDate = dr.RequestDate,
                    ProcessedDate = dr.ProcessedDate,
                    ApprovedDate = dr.ApprovedDate,
                    CompletedDate = dr.CompletedDate,
                    DocumentUrl = dr.DocumentUrl,
                    EmailSent = dr.EmailSent
                })
                .ToListAsync();

            return Ok(requests);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document requests for user {UserId}", userId);
            return StatusCode(500, new { message = "An error occurred while retrieving user document requests" });
        }
    }

    /// <summary>
    /// GET: api/DocumentRequests/reference/{referenceNumber} - Track request by reference number (Public)
    /// </summary>
    [HttpGet("reference/{referenceNumber}")]
    [AllowAnonymous]
    public async Task<ActionResult<DocumentRequestResponseDto>> GetByReferenceNumber(string referenceNumber)
    {
        try
        {
            var request = await _context.DocumentRequests
                .Include(dr => dr.User)
                .Include(dr => dr.DocumentType)
                .Where(dr => dr.ReferenceNumber == referenceNumber)
                .Select(dr => new DocumentRequestResponseDto
                {
                    Id = dr.Id,
                    ReferenceNumber = dr.ReferenceNumber,
                    UserId = dr.UserId,
                    UserName = $"{dr.User.FirstName} {dr.User.LastName}",
                    UserEmail = dr.User.Email,
                    DocumentTypeId = dr.DocumentTypeId,
                    DocumentTypeName = dr.DocumentType.Name,
                    Status = dr.Status,
                    Quantity = dr.Quantity,
                    Purpose = dr.Purpose,
                    Notes = dr.Notes,
                    DeliveryMethod = dr.DeliveryMethod,
                    PaymentMethod = dr.PaymentMethod,
                    PaymentStatus = dr.PaymentStatus,
                    PaymentAmount = dr.PaymentAmount,
                    RequestDate = dr.RequestDate,
                    ProcessedDate = dr.ProcessedDate,
                    ApprovedDate = dr.ApprovedDate,
                    CompletedDate = dr.CompletedDate,
                    DocumentUrl = dr.DocumentUrl,
                    EmailSent = dr.EmailSent
                })
                .FirstOrDefaultAsync();

            if (request == null)
            {
                return NotFound(new { message = $"Document request with reference number {referenceNumber} not found" });
            }

            return Ok(request);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error retrieving document request by reference {ReferenceNumber}", referenceNumber);
            return StatusCode(500, new { message = "An error occurred while retrieving the document request" });
        }
    }

    /// <summary>
    /// POST: api/DocumentRequests - Create a new document request (Students only)
    /// </summary>
    [HttpPost]
    [Authorize(Roles = "Student")]
    [RequestSizeLimit(10 * 1024 * 1024 + 64 * 1024)]
    public async Task<IActionResult> CreateDocumentRequest([FromForm] CreateDocumentRequestDto dto)
    {
        try
        {
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            if (currentUserId != dto.UserId.ToString())
                return Forbid();

            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == dto.UserId && u.IsActive);
            if (user == null)
            {
                return BadRequest(new { message = "Invalid or inactive user" });
            }

            // Validate document type exists
            var documentType = await _context.DocumentTypes.FindAsync(dto.DocumentTypeId);
            if (documentType == null || !documentType.IsActive)
            {
                return BadRequest(new { message = "Invalid or inactive document type" });
            }

            if (dto.DeliveryMethod == "CashOnDelivery" &&
                (string.IsNullOrWhiteSpace(dto.Address) || string.IsNullOrWhiteSpace(dto.PostalCode)))
            {
                return BadRequest(new { message = "Address and postal code are required for cash-on-delivery delivery" });
            }

            var amount = Math.Round(documentType.ProcessingFee * dto.Quantity, 2);
            var paymentMethod = amount > 0
                ? dto.PaymentMethod ?? (dto.DeliveryMethod == "SoftcopyOnly" ? "PayMongo" : "COD")
                : "None";
            if (amount > 0 && paymentMethod == "None")
            {
                return BadRequest(new { message = "Choose PayMongo or COD for this request" });
            }
            if (paymentMethod == "COD" &&
                dto.DeliveryMethod != "Pickup" &&
                dto.DeliveryMethod != "CashOnDelivery")
            {
                return BadRequest(new { message = "COD is only available for printed-document pickup or delivery" });
            }
            if (paymentMethod == "PayMongo" &&
                dto.DeliveryMethod != "SoftcopyOnly" &&
                dto.DeliveryMethod != "Pickup")
            {
                return BadRequest(new { message = "Online payment is only available for printed pickup or softcopy requests" });
            }

            var referenceNumber = await GenerateReferenceNumber();

            if (paymentMethod == "PayMongo")
            {
                var amountInCentavos = checked((long)(amount * 100));
                var checkout = await _payMongoCheckoutService.CreateCheckoutAsync(
                    referenceNumber,
                    documentType.Name,
                    dto.Quantity,
                    amountInCentavos,
                    user.Email,
                    HttpContext.RequestAborted);

                var pendingCheckout = new PendingDocumentRequestCheckout
                {
                    ReferenceNumber = referenceNumber,
                    UserId = dto.UserId,
                    DocumentTypeId = dto.DocumentTypeId,
                    Purpose = dto.Purpose,
                    Quantity = dto.Quantity,
                    Notes = dto.Notes ?? string.Empty,
                    DeliveryMethod = dto.DeliveryMethod,
                    PaymentMethod = "PayMongo",
                    PaymentStatus = "Pending",
                    Amount = amount,
                    PayMongoCheckoutSessionId = checkout.SessionId,
                    PayMongoCheckoutUrl = checkout.CheckoutUrl
                };
                _context.PendingDocumentRequestCheckouts.Add(pendingCheckout);
                await _context.SaveChangesAsync();

                return Ok(new
                {
                    checkoutUrl = checkout.CheckoutUrl,
                    referenceNumber
                });
            }

            var request = new DocumentRequest
            {
                ReferenceNumber = referenceNumber,
                UserId = dto.UserId,
                DocumentTypeId = dto.DocumentTypeId,
                Purpose = dto.Purpose,
                Quantity = dto.Quantity,
                Notes = dto.Notes ?? string.Empty,
                DeliveryMethod = dto.DeliveryMethod,
                DeliveryAddress = dto.DeliveryMethod == "CashOnDelivery" ? dto.Address?.Trim() : null,
                PostalCode = dto.DeliveryMethod == "CashOnDelivery" ? dto.PostalCode?.Trim() : null,
                PaymentMethod = paymentMethod,
                PaymentStatus = amount > 0 ? "Pending" : "NotRequired",
                PaymentAmount = amount,
                Status = "Request",
                RequestDate = DateTime.UtcNow
            };

            _context.DocumentRequests.Add(request);
            await _context.SaveChangesAsync();

            var createdRequest = await _context.DocumentRequests
                .Include(dr => dr.User)
                .Include(dr => dr.DocumentType)
                .Where(dr => dr.Id == request.Id)
                .Select(dr => new DocumentRequestResponseDto
                {
                    Id = dr.Id,
                    ReferenceNumber = dr.ReferenceNumber,
                    UserId = dr.UserId,
                    UserName = $"{dr.User.FirstName} {dr.User.LastName}",
                    UserEmail = dr.User.Email,
                    DocumentTypeId = dr.DocumentTypeId,
                    DocumentTypeName = dr.DocumentType.Name,
                    Status = dr.Status,
                    Quantity = dr.Quantity,
                    Purpose = dr.Purpose,
                    Notes = dr.Notes,
                    DeliveryMethod = dr.DeliveryMethod,
                    Address = dr.DeliveryAddress,
                    PostalCode = dr.PostalCode,
                    PaymentMethod = dr.PaymentMethod,
                    PaymentStatus = dr.PaymentStatus,
                    PaymentAmount = dr.PaymentAmount,
                    RequestDate = dr.RequestDate,
                    ProcessedDate = dr.ProcessedDate,
                    ApprovedDate = dr.ApprovedDate,
                    CompletedDate = dr.CompletedDate,
                    DocumentUrl = dr.DocumentUrl,
                    EmailSent = dr.EmailSent
                })
                .FirstAsync();

            // Send confirmation email
            _emailService.QueueRequestConfirmationEmail(
                createdRequest.UserEmail, createdRequest.UserName,
                createdRequest.ReferenceNumber, createdRequest.DocumentTypeName);

            // 🔥 REAL-TIME: Notify admins of new request
            await _hubContext.Clients.Group("admins").SendAsync("NewRequest", new
            {
                id = createdRequest.Id,
                referenceNumber = createdRequest.ReferenceNumber,
                userName = createdRequest.UserName,
                documentType = createdRequest.DocumentTypeName,
                requestDate = createdRequest.RequestDate
            });

            return CreatedAtAction(nameof(GetDocumentRequest), new { id = request.Id }, createdRequest);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating document request");
            return StatusCode(500, new { message = "An error occurred while creating the document request" });
        }
    }

    [HttpPost("{id}/payment")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> MarkCodPaymentReceived(int id)
    {
        try
        {
            var request = await _context.DocumentRequests.FindAsync(id);
            if (request == null)
                return NotFound(new { message = $"Document request with ID {id} not found" });

            if (request.PaymentMethod != "COD" || request.PaymentStatus != "Pending")
                return BadRequest(new { message = "Only pending COD payments can be marked as received" });

            request.PaymentStatus = "Paid";
            await _context.SaveChangesAsync();

            await _hubContext.Clients.Group($"user_{request.UserId}").SendAsync("RequestUpdated", new
            {
                id = request.Id,
                referenceNumber = request.ReferenceNumber,
                status = request.Status,
                paymentStatus = request.PaymentStatus,
                updatedAt = DateTime.UtcNow
            });

            return Ok(new { paymentStatus = request.PaymentStatus });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error recording COD payment for request {Id}", id);
            return StatusCode(500, new { message = "An error occurred while recording the payment" });
        }
    }

    /// <summary>
    /// PUT: api/DocumentRequests/{id} - Update document request status (Staff and Admin only)
    /// </summary>
    [HttpPut("{id}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> UpdateDocumentRequest(int id, UpdateDocumentRequestDto dto)
    {
        try
        {
            var request = await _context.DocumentRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = $"Document request with ID {id} not found" });
            }

            // Validate status transition
            if (!IsValidStatusTransition(request.Status, dto.Status, request.DeliveryMethod))
            {
                return BadRequest(new { message = $"Invalid status transition from {request.Status} to {dto.Status}" });
            }

            if (request.DeliveryMethod == "SoftcopyOnly" &&
                (dto.Status == "Approve" || dto.Status == "Download") &&
                string.IsNullOrWhiteSpace(request.DocumentUrl))
            {
                return BadRequest(new { message = "Upload the completed document before approving or completing a softcopy request" });
            }

            // Update status and timestamps
            var oldStatus = request.Status;
            request.Status = dto.Status;

            if (dto.Status == "InProcess" && oldStatus == "Request")
            {
                request.ProcessedDate = DateTime.UtcNow;
                request.ProcessedBy = dto.ProcessedBy;
            }
            else if (dto.Status == "Approve" && oldStatus == "InProcess")
            {
                request.ApprovedDate = DateTime.UtcNow;
                request.ApprovedBy = dto.ApprovedBy;
            }
            else if (dto.Status == "Download")
            {
                request.CompletedDate = DateTime.UtcNow;
            }

            if (!string.IsNullOrEmpty(dto.Notes))
            {
                request.Notes = dto.Notes;
            }

            if (!string.IsNullOrEmpty(dto.DocumentUrl))
            {
                request.DocumentUrl = dto.DocumentUrl;
            }

            await _context.SaveChangesAsync();

            // 🔥 REAL-TIME: Notify student of status update
            await _hubContext.Clients.Group($"user_{request.UserId}").SendAsync("RequestUpdated", new
            {
                id = request.Id,
                referenceNumber = request.ReferenceNumber,
                status = request.Status,
                documentUrl = request.DocumentUrl,
                updatedAt = DateTime.UtcNow
            });

            // Send status update email
            var user = await _context.Users.FindAsync(request.UserId);
            if (user != null)
            {
                string? attachmentPath = null;
                if (dto.Status == "Download" && !string.IsNullOrEmpty(request.DocumentUrl))
                {
                    // DocumentUrl is like "/uploads/documents/filename.pdf"
                    attachmentPath = Path.Combine(Directory.GetCurrentDirectory(), request.DocumentUrl.TrimStart('/').Replace('/', Path.DirectorySeparatorChar));
                }

                _emailService.QueueStatusUpdateEmail(
                    user.Email, $"{user.FirstName} {user.LastName}",
                    request.ReferenceNumber, dto.Status, dto.Notes, attachmentPath, request.DeliveryMethod);
            }

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating document request {Id}", id);
            return StatusCode(500, new { message = "An error occurred while updating the document request" });
        }
    }

    /// <summary>
    /// DELETE: api/DocumentRequests/{id} - Delete a document request
    /// </summary>
    [HttpDelete("{id}")]
    [Authorize(Roles = "Student,Admin")]
    public async Task<IActionResult> DeleteDocumentRequest(int id)
    {
        try
        {
            var request = await _context.DocumentRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = $"Document request with ID {id} not found" });
            }

            // Students can only delete their own requests
            var userRole = User.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;
            var currentUserId = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
            
            if (userRole == "Student" && int.TryParse(currentUserId, out int studentId))
            {
                if (request.UserId != studentId)
                {
                    return Forbid();
                }
            }

            // Only allow deletion of requests in "Request" status
            if (request.Status != "Request")
            {
                return BadRequest(new { message = "Only requests in 'Request' status can be deleted" });
            }

            if (request.PaymentStatus == "Paid")
            {
                return BadRequest(new { message = "Paid requests cannot be deleted" });
            }

            _context.DocumentRequests.Remove(request);
            await _context.SaveChangesAsync();

            return NoContent();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting document request {Id}", id);
            return StatusCode(500, new { message = "An error occurred while deleting the document request" });
        }
    }

    /// <summary>
    /// POST: api/DocumentRequests/{id}/upload - Upload document file (Staff and Admin only)
    /// Accepts PDF and image files only
    /// </summary>
    /// <summary>
    /// POST: api/DocumentRequests/{id}/upload - Upload document file
    /// </summary>
    [HttpPost("{id}/upload")]
    [Authorize(Roles = "Admin,Staff")]
    [Consumes("multipart/form-data")]
    public async Task<IActionResult> UploadDocument(int id, IFormFile file)
    {
        try
        {
            var request = await _context.DocumentRequests.FindAsync(id);
            if (request == null)
            {
                return NotFound(new { message = $"Document request with ID {id} not found" });
            }

            // Validate file
            if (file == null || file.Length == 0)
            {
                return BadRequest(new { message = "No file uploaded" });
            }

            // Validate file type (PDF and images only)
            var allowedExtensions = new[] { ".pdf", ".jpg", ".jpeg", ".png" };
            var allowedContentTypes = new[] { "application/pdf", "image/jpeg", "image/jpg", "image/png" };
            
            var fileExtension = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (!allowedExtensions.Contains(fileExtension) || !allowedContentTypes.Contains(file.ContentType.ToLowerInvariant()))
            {
                return BadRequest(new { message = "Only PDF and image files (JPG, JPEG, PNG) are allowed" });
            }

            // Validate file size (max 10MB)
            if (file.Length > 10 * 1024 * 1024)
            {
                return BadRequest(new { message = "File size cannot exceed 10MB" });
            }

            // Create uploads directory if it doesn't exist
            var uploadsPath = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "documents");
            Directory.CreateDirectory(uploadsPath);

            // Generate unique filename
            var fileName = $"{request.ReferenceNumber}_{Guid.NewGuid()}{fileExtension}";
            var filePath = Path.Combine(uploadsPath, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            // Update request with file URL
            request.DocumentUrl = $"/uploads/documents/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { 
                message = "File uploaded successfully", 
                documentUrl = request.DocumentUrl,
                fileName = fileName
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error uploading document for request {Id}", id);
            return StatusCode(500, new { message = "An error occurred while uploading the document" });
        }
    }

    private async Task<string> GenerateReferenceNumber()
    {
        var prefix = $"DR{DateTime.UtcNow:yyyyMMdd}";
        var requestCount = await _context.DocumentRequests
            .CountAsync(request => request.ReferenceNumber.StartsWith(prefix));
        var checkoutCount = await _context.PendingDocumentRequestCheckouts
            .CountAsync(checkout => checkout.ReferenceNumber.StartsWith(prefix));
        var sequence = Math.Max(requestCount, checkoutCount) + 1;

        while (true)
        {
            var referenceNumber = $"{prefix}{sequence:D4}";
            var requestExists = await _context.DocumentRequests
                .AnyAsync(request => request.ReferenceNumber == referenceNumber);
            var checkoutExists = await _context.PendingDocumentRequestCheckouts
                .AnyAsync(checkout => checkout.ReferenceNumber == referenceNumber);

            if (!requestExists && !checkoutExists)
                return referenceNumber;

            sequence++;
        }
    }

    private bool IsValidStatusTransition(string currentStatus, string newStatus, string deliveryMethod)
    {
        var validTransitions = new Dictionary<string, List<string>>
        {
            { "Request", new List<string> { "InProcess" } },
            { "InProcess", new List<string> { "Approve", "Request" } },
            { "Approve", new List<string> { "Receive", "InProcess" } },
            { "Receive", new List<string> { "Download", "Approve" } },
            { "Download", new List<string> { } }
        };

        if (deliveryMethod == "SoftcopyOnly" && currentStatus == "Approve")
        {
            return newStatus == "Download" || newStatus == "InProcess";
        }

        return validTransitions.ContainsKey(currentStatus) && 
               validTransitions[currentStatus].Contains(newStatus);
    }
}
