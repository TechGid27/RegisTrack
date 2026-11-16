using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Doctrack_backend_api.Migrations
{
    /// <inheritdoc />
    public partial class AddRegistrationAndRequestOptions : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "AcademicLevel",
                table: "Users",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CourseProgram",
                table: "Users",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DeliveryMethod",
                table: "DocumentRequests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentMethod",
                table: "DocumentRequests",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PaymentReceiptFileName",
                table: "DocumentRequests",
                type: "nvarchar(255)",
                maxLength: 255,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AcademicLevel",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "CourseProgram",
                table: "Users");

            migrationBuilder.DropColumn(
                name: "DeliveryMethod",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "PaymentMethod",
                table: "DocumentRequests");

            migrationBuilder.DropColumn(
                name: "PaymentReceiptFileName",
                table: "DocumentRequests");
        }
    }
}
