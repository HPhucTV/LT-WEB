using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260603193000_AddGroupBookingFields")]
    public partial class AddGroupBookingFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "BookingType" character varying(30) NOT NULL DEFAULT 'Shared';
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Tours"
                ADD COLUMN IF NOT EXISTS "MinGroupGuests" integer NOT NULL DEFAULT 10;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "BookingType",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "MinGroupGuests",
                table: "Tours");
        }
    }
}
