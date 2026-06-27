using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelTour.Api.Migrations
{
    /// <inheritdoc />
    public partial class RemoveBookingCompanyFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CompanyAddress",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CompanyName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CompanyTaxCode",
                table: "Bookings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CompanyAddress",
                table: "Bookings",
                type: "character varying(240)",
                maxLength: 240,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CompanyName",
                table: "Bookings",
                type: "character varying(160)",
                maxLength: 160,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "CompanyTaxCode",
                table: "Bookings",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);
        }
    }
}
