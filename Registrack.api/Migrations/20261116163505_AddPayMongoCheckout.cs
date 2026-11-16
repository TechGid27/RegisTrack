using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Doctrack_backend_api.Migrations
{
    /// <inheritdoc />
    public partial class AddPayMongoCheckout : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PayMongoCheckoutSessionId",
                table: "DocumentRequests",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PayMongoCheckoutUrl",
                table: "DocumentRequests",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PaymentStatus",
                table: "DocumentRequests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "PayMongoCheckoutSessionId",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "PayMongoCheckoutUrl",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "PaymentStatus",
                table: "DocumentRequests");
        }
    }
}
