using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Doctrack_backend_api.Migrations
{
    /// <inheritdoc />
    public partial class AddCashOnDeliveryAddress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DeliveryAddress",
                table: "DocumentRequests",
                type: "nvarchar(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PostalCode",
                table: "DocumentRequests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeliveryAddress",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "PostalCode",
                table: "DocumentRequests");
        }
    }
}
