using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260604123000_AddBookingVoucherFields")]
    public partial class AddBookingVoucherFields : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "VoucherCode" character varying(40);
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "VoucherDiscountAmount" numeric(18,2) NOT NULL DEFAULT 0;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
