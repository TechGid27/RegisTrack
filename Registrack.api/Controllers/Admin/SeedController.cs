using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using Doctrack_backend_api.Data;
using Doctrack_backend_api.Models;
using BCrypt.Net;

namespace Doctrack_backend_api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")] // Only admins can seed data
public class SeedController : ControllerBase
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<SeedController> _logger;

    public SeedController(ApplicationDbContext context, ILogger<SeedController> logger)
    {
        _context = context;
        _logger = logger;
    }

    /// <summary>
    /// POST: api/Seed/document-types - Seed common document types
    /// </summary>
    [HttpPost("document-types")]
    public async Task<IActionResult> SeedDocumentTypes()
    {
        try
        {
            // Documents Requiring Payment
            var documentTypes = new List<DocumentType>
            {
                // Academic Records (Requiring Payment)
                new DocumentType
                {
                    Name = "Form 137 (Permanent Record/Transcript)",
                    Description = "Permanent academic record/transcript - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Form 138 (Report Card)",
                    Description = "Official report card - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Transcript of Records (TOR)",
                    Description = "Official academic transcript - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                
                // Certificates (Requiring Payment)
                new DocumentType
                {
                    Name = "Good Moral Character Certificate",
                    Description = "Certificate of good moral character - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Certificate of Graduation",
                    Description = "Official graduation certificate - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Other Certificates",
                    Description = "All other certificates - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                
                // Transfer Credentials (Requiring Payment)
                new DocumentType
                {
                    Name = "Honorable Dismissal",
                    Description = "Transfer credential for students moving to another institution - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                
                // College Documents (Requiring Payment)
                new DocumentType
                {
                    Name = "Summary of Grades",
                    Description = "Summary of academic grades - Requires payment",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 3,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                
                // Documents NOT Requiring Payment
                new DocumentType
                {
                    Name = "Diploma",
                    Description = "Official graduation diploma - No payment required",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 7,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Initial Form 138 (Report Card)",
                    Description = "Initial report card - No payment required",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Public School Form 137",
                    Description = "Public school permanent record - No payment required",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 5,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                },
                new DocumentType
                {
                    Name = "Informative Copy of Grades",
                    Description = "Informative copy of grades - No payment required",
                    ProcessingFee = 0.00m,
                    ProcessingDays = 2,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                }
            };

            var addedCount = 0;
            var skippedCount = 0;

            foreach (var docType in documentTypes)
            {
                var exists = await _context.DocumentTypes
                    .AnyAsync(dt => dt.Name.ToLower() == docType.Name.ToLower());

                if (!exists)
                {
                    _context.DocumentTypes.Add(docType);
                    addedCount++;
                }
                else
                {
                    skippedCount++;
                }
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Document types seeding completed",
                added = addedCount,
                skipped = skippedCount,
                total = documentTypes.Count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding document types");
            return StatusCode(500, new { message = "An error occurred while seeding document types", error = ex.Message });
        }
    }

    /// <summary>
    /// POST: api/Seed/document-requests - Seed realistic example document requests
    /// </summary>
    [HttpPost("document-requests")]
    public async Task<IActionResult> SeedDocumentRequests()
    {
        try
        {
            var demoPasswordHash = BCrypt.Net.BCrypt.HashPassword("DemoPassword123!");
            var now = DateTime.UtcNow;

            var sampleUsers = new[]
            {
                new { FirstName = "Maria", LastName = "Santos", Email = "maria.santos@example.com", StudentId = "2024-0001", Department = "College of Education" },
                new { FirstName = "Juan", LastName = "Dela Cruz", Email = "juan.delacruz@example.com", StudentId = "2024-0002", Department = "College of Business" },
                new { FirstName = "Ana", LastName = "Reyes", Email = "ana.reyes@example.com", StudentId = "2023-0045", Department = "College of Arts and Sciences" },
                new { FirstName = "Mark", LastName = "Cruz", Email = "mark.cruz@example.com", StudentId = "2022-0123", Department = "College of Engineering" }
            };

            var users = new Dictionary<string, User>();
            var addedUsers = 0;

            foreach (var sample in sampleUsers)
            {
                var user = await _context.Users.FirstOrDefaultAsync(u =>
                    u.Email.ToLower() == sample.Email.ToLower() || u.StudentId == sample.StudentId);

                if (user == null)
                {
                    user = new User
                    {
                        FirstName = sample.FirstName,
                        LastName = sample.LastName,
                        Email = sample.Email,
                        StudentId = sample.StudentId,
                        Department = sample.Department,
                        Role = "Student",
                        PasswordHash = demoPasswordHash,
                        IsActive = true,
                        IsEmailVerified = true,
                        CreatedAt = now.AddMonths(-8)
                    };
                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                    addedUsers++;
                }

                users[sample.StudentId] = user;
            }

            var documentTypeNames = new[]
            {
                "Transcript of Records (TOR)",
                "Good Moral Character Certificate",
                "Certificate of Graduation",
                "Form 137 (Permanent Record/Transcript)"
            };

            foreach (var name in documentTypeNames)
            {
                var exists = await _context.DocumentTypes.AnyAsync(dt => dt.Name.ToLower() == name.ToLower());
                if (!exists)
                {
                    _context.DocumentTypes.Add(new DocumentType
                    {
                        Name = name,
                        Description = $"Official {name} requested through RegisTrack.",
                        ProcessingFee = 0m,
                        ProcessingDays = 3,
                        IsActive = true,
                        CreatedAt = now.AddMonths(-6)
                    });
                }
            }
            await _context.SaveChangesAsync();

            var tor = await _context.DocumentTypes.FirstAsync(dt => dt.Name == documentTypeNames[0]);
            var goodMoral = await _context.DocumentTypes.FirstAsync(dt => dt.Name == documentTypeNames[1]);
            var graduation = await _context.DocumentTypes.FirstAsync(dt => dt.Name == documentTypeNames[2]);
            var form137 = await _context.DocumentTypes.FirstAsync(dt => dt.Name == documentTypeNames[3]);

            var demoRequests = new[]
            {
                new
                {
                    ReferenceNumber = "DR-20261107-0001",
                    StudentId = "2024-0001",
                    DocumentType = tor,
                    Status = "Request",
                    Quantity = 1,
                    Purpose = "For scholarship application and school financial assistance requirements.",
                    Notes = "Please process together with school records.",
                    RequestDate = now.AddDays(-1),
                    ProcessedDate = (DateTime?)null,
                    ApprovedDate = (DateTime?)null,
                    CompletedDate = (DateTime?)null
                },
                new
                {
                    ReferenceNumber = "DR-20261107-0002",
                    StudentId = "2024-0002",
                    DocumentType = goodMoral,
                    Status = "InProcess",
                    Quantity = 2,
                    Purpose = "For employment application and local government requirements.",
                    Notes = "Student requested two signed copies.",
                    RequestDate = now.AddDays(-3),
                    ProcessedDate = (DateTime?)now.AddDays(-2),
                    ApprovedDate = (DateTime?)null,
                    CompletedDate = (DateTime?)null
                },
                new
                {
                    ReferenceNumber = "DR-20261107-0003",
                    StudentId = "2023-0045",
                    DocumentType = graduation,
                    Status = "Approve",
                    Quantity = 1,
                    Purpose = "Required for board examination application.",
                    Notes = "Awaiting final release approval.",
                    RequestDate = now.AddDays(-6),
                    ProcessedDate = (DateTime?)now.AddDays(-5),
                    ApprovedDate = (DateTime?)now.AddDays(-1),
                    CompletedDate = (DateTime?)null
                },
                new
                {
                    ReferenceNumber = "DR-20261107-0004",
                    StudentId = "2022-0123",
                    DocumentType = form137,
                    Status = "Receive",
                    Quantity = 1,
                    Purpose = "For transfer credentials to another educational institution.",
                    Notes = "Document is ready for student pickup.",
                    RequestDate = now.AddDays(-10),
                    ProcessedDate = (DateTime?)now.AddDays(-8),
                    ApprovedDate = (DateTime?)now.AddDays(-5),
                    CompletedDate = (DateTime?)now.AddDays(-1)
                }
            };

            var addedRequests = 0;
            var skippedRequests = 0;

            foreach (var sample in demoRequests)
            {
                var exists = await _context.DocumentRequests.AnyAsync(dr => dr.ReferenceNumber == sample.ReferenceNumber);
                if (exists)
                {
                    skippedRequests++;
                    continue;
                }

                _context.DocumentRequests.Add(new DocumentRequest
                {
                    ReferenceNumber = sample.ReferenceNumber,
                    UserId = users[sample.StudentId].Id,
                    DocumentTypeId = sample.DocumentType.Id,
                    Status = sample.Status,
                    Quantity = sample.Quantity,
                    Purpose = sample.Purpose,
                    Notes = sample.Notes,
                    RequestDate = sample.RequestDate,
                    ProcessedDate = sample.ProcessedDate,
                    ApprovedDate = sample.ApprovedDate,
                    CompletedDate = sample.CompletedDate,
                    EmailSent = false
                });
                addedRequests++;
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Example document requests seeding completed",
                demoPassword = "DemoPassword123!",
                addedUsers,
                addedRequests,
                skippedRequests,
                statuses = new[] { "Request", "InProcess", "Approve", "Receive" }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding example document requests");
            return StatusCode(500, new
            {
                message = "An error occurred while seeding example document requests",
                error = ex.Message
            });
        }
    }

    /// <summary>
    /// DELETE: api/Seed/document-types - Clear all document types (use with caution)
    /// </summary>
    [HttpDelete("document-types")]
    public async Task<IActionResult> ClearDocumentTypes()
    {
        try
        {
            var documentTypes = await _context.DocumentTypes.ToListAsync();
            var count = documentTypes.Count;
            
            _context.DocumentTypes.RemoveRange(documentTypes);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "All document types cleared",
                deleted = count
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error clearing document types");
            return StatusCode(500, new { message = "An error occurred while clearing document types", error = ex.Message });
        }
    }
}
