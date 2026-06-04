using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260604120000_AddPrivateGroupScheduleType")]
    public partial class AddPrivateGroupScheduleType : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "TourSchedules"
                ADD COLUMN IF NOT EXISTS "ScheduleType" character varying(30) NOT NULL DEFAULT 'Shared';
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_TourSchedules_ScheduleType"
                ON "TourSchedules" ("ScheduleType");
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
