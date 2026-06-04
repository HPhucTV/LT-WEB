using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260603200000_AddBookingCustomerEmail")]
    public partial class AddBookingCustomerEmail : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "CustomerEmail" character varying(120) NOT NULL DEFAULT '';
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerEmail",
                table: "Bookings");
        }
    }
}
