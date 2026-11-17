using Microsoft.EntityFrameworkCore;
using Doctrack_backend_api.Models;

namespace Doctrack_backend_api.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : base(options)
    {
    }
    
    public DbSet<User> Users { get; set; }
    public DbSet<DocumentType> DocumentTypes { get; set; }
    public DbSet<DocumentRequest> DocumentRequests { get; set; }
    public DbSet<PendingDocumentRequestCheckout> PendingDocumentRequestCheckouts { get; set; }
    public DbSet<DocumentRequirement> DocumentRequirements { get; set; }
    public DbSet<Announcement> Announcements { get; set; }
    
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        
        // User configuration
        modelBuilder.Entity<User>()
            .HasIndex(u => u.Email)
            .IsUnique();
            
        modelBuilder.Entity<User>()
            .HasIndex(u => u.StudentId)
            .IsUnique();
        
        // DocumentRequest configuration
        modelBuilder.Entity<DocumentRequest>()
            .HasIndex(dr => dr.ReferenceNumber)
            .IsUnique();

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasIndex(checkout => checkout.ReferenceNumber)
            .IsUnique();

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasIndex(checkout => checkout.PayMongoCheckoutSessionId)
            .IsUnique()
            .HasFilter("[PayMongoCheckoutSessionId] IS NOT NULL");

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasIndex(checkout => checkout.DocumentRequestId)
            .IsUnique()
            .HasFilter("[DocumentRequestId] IS NOT NULL");

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .Property(checkout => checkout.Amount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<DocumentRequest>()
            .Property(request => request.PaymentAmount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<DocumentType>()
            .Property(documentType => documentType.ProcessingFee)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasOne<User>()
            .WithMany()
            .HasForeignKey(checkout => checkout.UserId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasOne<DocumentType>()
            .WithMany()
            .HasForeignKey(checkout => checkout.DocumentTypeId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<PendingDocumentRequestCheckout>()
            .HasOne<DocumentRequest>()
            .WithMany()
            .HasForeignKey(checkout => checkout.DocumentRequestId)
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<DocumentRequest>()
            .HasOne(dr => dr.User)
            .WithMany(u => u.DocumentRequests)
            .HasForeignKey(dr => dr.UserId)
            .OnDelete(DeleteBehavior.Restrict);
            
        modelBuilder.Entity<DocumentRequest>()
            .HasOne(dr => dr.DocumentType)
            .WithMany(dt => dt.DocumentRequests)
            .HasForeignKey(dr => dr.DocumentTypeId)
            .OnDelete(DeleteBehavior.Restrict);
        
        // DocumentRequirement configuration
        modelBuilder.Entity<DocumentRequirement>()
            .HasOne(dr => dr.DocumentType)
            .WithMany(dt => dt.Requirements)
            .HasForeignKey(dr => dr.DocumentTypeId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
