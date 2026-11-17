using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Doctrack_backend_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPendingDocumentRequestCheckouts : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PendingDocumentRequestCheckouts",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ReferenceNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    DocumentTypeId = table.Column<int>(type: "int", nullable: false),
                    Purpose = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    Quantity = table.Column<int>(type: "int", nullable: false),
                    Notes = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    DeliveryMethod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaymentMethod = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PaymentStatus = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    PayMongoCheckoutSessionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PayMongoCheckoutUrl = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    DocumentRequestId = table.Column<int>(type: "int", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PendingDocumentRequestCheckouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PendingDocumentRequestCheckouts_DocumentRequests_DocumentRequestId",
                        column: x => x.DocumentRequestId,
                        principalTable: "DocumentRequests",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PendingDocumentRequestCheckouts_DocumentTypes_DocumentTypeId",
                        column: x => x.DocumentTypeId,
                        principalTable: "DocumentTypes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_PendingDocumentRequestCheckouts_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PendingDocumentRequestCheckouts_DocumentRequestId",
                table: "PendingDocumentRequestCheckouts",
                column: "DocumentRequestId",
                unique: true,
                filter: "[DocumentRequestId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PendingDocumentRequestCheckouts_DocumentTypeId",
                table: "PendingDocumentRequestCheckouts",
                column: "DocumentTypeId");

            migrationBuilder.CreateIndex(
                name: "IX_PendingDocumentRequestCheckouts_PayMongoCheckoutSessionId",
                table: "PendingDocumentRequestCheckouts",
                column: "PayMongoCheckoutSessionId",
                unique: true,
                filter: "[PayMongoCheckoutSessionId] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_PendingDocumentRequestCheckouts_ReferenceNumber",
                table: "PendingDocumentRequestCheckouts",
                column: "ReferenceNumber",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_PendingDocumentRequestCheckouts_UserId",
                table: "PendingDocumentRequestCheckouts",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PendingDocumentRequestCheckouts");
        }
    }
}
