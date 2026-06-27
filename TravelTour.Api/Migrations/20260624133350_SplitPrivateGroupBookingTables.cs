using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelTour.Api.Migrations
{
    /// <inheritdoc />
    public partial class SplitPrivateGroupBookingTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "PrivateGroupBookingDetails",
                columns: table => new
                {
                    BookingId = table.Column<int>(type: "integer", nullable: false),
                    RequestNote = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    AdultCount = table.Column<int>(type: "integer", nullable: false),
                    ChildCount = table.Column<int>(type: "integer", nullable: false),
                    EstimatedAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivateGroupBookingDetails", x => x.BookingId);
                    table.ForeignKey(
                        name: "FK_PrivateGroupBookingDetails_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PrivateGroupContracts",
                columns: table => new
                {
                    BookingId = table.Column<int>(type: "integer", nullable: false),
                    SalesUserId = table.Column<int>(type: "integer", nullable: true),
                    SalesName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    ContractStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "None"),
                    ContractAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    PaymentTerms = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CancellationTerms = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    DepositAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RemainingAmount = table.Column<decimal>(type: "numeric(18,2)", nullable: false),
                    RemainingDueDate = table.Column<DateOnly>(type: "date", nullable: true),
                    DepositPaymentStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "Unpaid"),
                    RemainingPaymentStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "Unpaid"),
                    DepositPaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    RemainingPaidAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    DepositTransactionRef = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    RemainingTransactionRef = table.Column<string>(type: "character varying(80)", maxLength: 80, nullable: true),
                    SalesSignedByUserId = table.Column<int>(type: "integer", nullable: true),
                    SalesSignedByName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    SalesSignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CustomerSignedByName = table.Column<string>(type: "character varying(120)", maxLength: 120, nullable: true),
                    CustomerSignedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CustomerSignatureStatus = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false, defaultValue: "Pending")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrivateGroupContracts", x => x.BookingId);
                    table.ForeignKey(
                        name: "FK_PrivateGroupContracts_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PrivateGroupContracts_Users_SalesUserId",
                        column: x => x.SalesUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrivateGroupContracts_SalesUserId",
                table: "PrivateGroupContracts",
                column: "SalesUserId");

            migrationBuilder.Sql("""
                INSERT INTO "PrivateGroupBookingDetails" ("BookingId", "RequestNote", "AdultCount", "ChildCount", "EstimatedAmount")
                SELECT "Id", "RequestNote", "AdultCount", "ChildCount", "EstimatedAmount"
                FROM "Bookings"
                WHERE "BookingType" = 'PrivateGroup';
                """);

            migrationBuilder.Sql("""
                INSERT INTO "PrivateGroupContracts" (
                    "BookingId", "SalesUserId", "SalesName", "ContractStatus", "ContractAmount",
                    "PaymentTerms", "CancellationTerms", "DepositAmount", "RemainingAmount", "RemainingDueDate",
                    "DepositPaymentStatus", "RemainingPaymentStatus", "DepositPaidAt", "RemainingPaidAt",
                    "DepositTransactionRef", "RemainingTransactionRef", "SalesSignedByUserId", "SalesSignedByName",
                    "SalesSignedAt", "CustomerSignedByName", "CustomerSignedAt", "CustomerSignatureStatus")
                SELECT
                    "Id", "SalesUserId", "SalesName", "ContractStatus", "ContractAmount",
                    "PaymentTerms", "CancellationTerms", "DepositAmount", "RemainingAmount", "RemainingDueDate",
                    "DepositPaymentStatus", "RemainingPaymentStatus", "DepositPaidAt", "RemainingPaidAt",
                    "DepositTransactionRef", "RemainingTransactionRef", "SalesSignedByUserId", "SalesSignedByName",
                    "SalesSignedAt", "CustomerSignedByName", "CustomerSignedAt", "CustomerSignatureStatus"
                FROM "Bookings"
                WHERE "BookingType" = 'PrivateGroup';
                """);

            migrationBuilder.DropForeignKey(
                name: "FK_Bookings_Users_SalesUserId",
                table: "Bookings");

            migrationBuilder.DropIndex(
                name: "IX_Bookings_SalesUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "AdultCount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CancellationTerms",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ChildCount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ContractAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "ContractStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CustomerSignatureStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CustomerSignedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "CustomerSignedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DepositAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DepositPaidAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DepositPaymentStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "DepositTransactionRef",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "EstimatedAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "PaymentTerms",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RemainingAmount",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RemainingDueDate",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RemainingPaidAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RemainingPaymentStatus",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RemainingTransactionRef",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "RequestNote",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesSignedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesSignedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesSignedByUserId",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesUserId",
                table: "Bookings");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrivateGroupBookingDetails");

            migrationBuilder.DropTable(
                name: "PrivateGroupContracts");

            migrationBuilder.AddColumn<int>(
                name: "AdultCount",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<string>(
                name: "CancellationTerms",
                table: "Bookings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ChildCount",
                table: "Bookings",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<decimal>(
                name: "ContractAmount",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "ContractStatus",
                table: "Bookings",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "None");

            migrationBuilder.AddColumn<string>(
                name: "CustomerSignatureStatus",
                table: "Bookings",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Pending");

            migrationBuilder.AddColumn<DateTime>(
                name: "CustomerSignedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CustomerSignedByName",
                table: "Bookings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "DepositAmount",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateTime>(
                name: "DepositPaidAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DepositPaymentStatus",
                table: "Bookings",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Unpaid");

            migrationBuilder.AddColumn<string>(
                name: "DepositTransactionRef",
                table: "Bookings",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "EstimatedAmount",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "PaymentTerms",
                table: "Bookings",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "RemainingAmount",
                table: "Bookings",
                type: "numeric(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<DateOnly>(
                name: "RemainingDueDate",
                table: "Bookings",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "RemainingPaidAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RemainingPaymentStatus",
                table: "Bookings",
                type: "character varying(40)",
                maxLength: 40,
                nullable: false,
                defaultValue: "Unpaid");

            migrationBuilder.AddColumn<string>(
                name: "RemainingTransactionRef",
                table: "Bookings",
                type: "character varying(80)",
                maxLength: 80,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "RequestNote",
                table: "Bookings",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SalesName",
                table: "Bookings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "SalesSignedAt",
                table: "Bookings",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SalesSignedByName",
                table: "Bookings",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SalesSignedByUserId",
                table: "Bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "SalesUserId",
                table: "Bookings",
                type: "integer",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Bookings" AS b
                SET
                    "RequestNote" = d."RequestNote",
                    "AdultCount" = d."AdultCount",
                    "ChildCount" = d."ChildCount",
                    "EstimatedAmount" = d."EstimatedAmount"
                FROM "PrivateGroupBookingDetails" AS d
                WHERE b."Id" = d."BookingId";
                """);

            migrationBuilder.Sql("""
                UPDATE "Bookings" AS b
                SET
                    "SalesUserId" = c."SalesUserId",
                    "SalesName" = c."SalesName",
                    "ContractStatus" = c."ContractStatus",
                    "ContractAmount" = c."ContractAmount",
                    "PaymentTerms" = c."PaymentTerms",
                    "CancellationTerms" = c."CancellationTerms",
                    "DepositAmount" = c."DepositAmount",
                    "RemainingAmount" = c."RemainingAmount",
                    "RemainingDueDate" = c."RemainingDueDate",
                    "DepositPaymentStatus" = c."DepositPaymentStatus",
                    "RemainingPaymentStatus" = c."RemainingPaymentStatus",
                    "DepositPaidAt" = c."DepositPaidAt",
                    "RemainingPaidAt" = c."RemainingPaidAt",
                    "DepositTransactionRef" = c."DepositTransactionRef",
                    "RemainingTransactionRef" = c."RemainingTransactionRef",
                    "SalesSignedByUserId" = c."SalesSignedByUserId",
                    "SalesSignedByName" = c."SalesSignedByName",
                    "SalesSignedAt" = c."SalesSignedAt",
                    "CustomerSignedByName" = c."CustomerSignedByName",
                    "CustomerSignedAt" = c."CustomerSignedAt",
                    "CustomerSignatureStatus" = c."CustomerSignatureStatus"
                FROM "PrivateGroupContracts" AS c
                WHERE b."Id" = c."BookingId";
                """);

            migrationBuilder.CreateIndex(
                name: "IX_Bookings_SalesUserId",
                table: "Bookings",
                column: "SalesUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Bookings_Users_SalesUserId",
                table: "Bookings",
                column: "SalesUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.DropTable(
                name: "PrivateGroupBookingDetails");

            migrationBuilder.DropTable(
                name: "PrivateGroupContracts");
        }
    }
}
