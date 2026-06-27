using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260621120000_AddSchedulePricingAndGroupContracts")]
    public partial class AddSchedulePricingAndGroupContracts : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "TourSchedules"
                ADD COLUMN IF NOT EXISTS "Price" numeric(18,2) NOT NULL DEFAULT 0;

                ALTER TABLE "TourSchedules"
                ADD COLUMN IF NOT EXISTS "OriginalPrice" numeric(18,2) NOT NULL DEFAULT 0;

                UPDATE "TourSchedules" AS s
                SET
                    "Price" = CASE WHEN s."Price" = 0 THEN t."Price" ELSE s."Price" END,
                    "OriginalPrice" = CASE WHEN s."OriginalPrice" = 0 THEN t."OriginalPrice" ELSE s."OriginalPrice" END
                FROM "Tours" AS t
                WHERE s."TourId" = t."Id";
                """);

            migrationBuilder.Sql("""
                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "CompanyName" character varying(160) NOT NULL DEFAULT '';

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "CompanyTaxCode" character varying(40);

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "CompanyAddress" character varying(240);

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "ContractNote" character varying(500);

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "SalesUserId" integer;

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "SalesName" character varying(120);

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "ContractStatus" character varying(40) NOT NULL DEFAULT 'None';

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "ContractAmount" numeric(18,2) NOT NULL DEFAULT 0;

                ALTER TABLE "Bookings"
                ADD COLUMN IF NOT EXISTS "EstimatedAmount" numeric(18,2) NOT NULL DEFAULT 0;

                UPDATE "Bookings"
                SET "EstimatedAmount" = "TotalAmount"
                WHERE "EstimatedAmount" = 0;
                """);

            migrationBuilder.Sql("""
                CREATE INDEX IF NOT EXISTS "IX_Bookings_SalesUserId"
                ON "Bookings" ("SalesUserId");
                """);

            migrationBuilder.Sql("""
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1
                        FROM pg_constraint
                        WHERE conname = 'FK_Bookings_Users_SalesUserId'
                    ) THEN
                        ALTER TABLE "Bookings"
                        ADD CONSTRAINT "FK_Bookings_Users_SalesUserId"
                        FOREIGN KEY ("SalesUserId") REFERENCES "Users" ("Id")
                        ON DELETE SET NULL;
                    END IF;
                END $$;
                """);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
