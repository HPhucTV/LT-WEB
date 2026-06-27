using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TravelTour.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGroupContractWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "ContractNote",
                table: "Bookings",
                newName: "RequestNote");

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

            migrationBuilder.CreateTable(
                name: "BookingPassengers",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    BookingId = table.Column<int>(type: "integer", nullable: false),
                    FullName = table.Column<string>(type: "character varying(160)", maxLength: 160, nullable: false),
                    DateOfBirth = table.Column<DateOnly>(type: "date", nullable: false),
                    PassengerType = table.Column<string>(type: "character varying(20)", maxLength: 20, nullable: false),
                    IdentityNumber = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: true),
                    Phone = table.Column<string>(type: "character varying(30)", maxLength: 30, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BookingPassengers", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BookingPassengers_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_BookingPassengers_BookingId",
                table: "BookingPassengers",
                column: "BookingId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BookingPassengers");

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
                name: "SalesSignedAt",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesSignedByName",
                table: "Bookings");

            migrationBuilder.DropColumn(
                name: "SalesSignedByUserId",
                table: "Bookings");

            migrationBuilder.RenameColumn(
                name: "RequestNote",
                table: "Bookings",
                newName: "ContractNote");
        }
    }
}
