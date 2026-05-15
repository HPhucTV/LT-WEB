using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace TravelTour.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGuideAvailabilityAssignment : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "GuideUserId",
                table: "TourSchedules",
                type: "integer",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "GuideAvailabilities",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    GuideUserId = table.Column<int>(type: "integer", nullable: false),
                    StartDate = table.Column<DateOnly>(type: "date", nullable: false),
                    EndDate = table.Column<DateOnly>(type: "date", nullable: false),
                    Status = table.Column<string>(type: "character varying(40)", maxLength: 40, nullable: false),
                    Note = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_GuideAvailabilities", x => x.Id);
                    table.ForeignKey(
                        name: "FK_GuideAvailabilities_Users_GuideUserId",
                        column: x => x.GuideUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_TourSchedules_GuideUserId",
                table: "TourSchedules",
                column: "GuideUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GuideAvailabilities_GuideUserId",
                table: "GuideAvailabilities",
                column: "GuideUserId");

            migrationBuilder.CreateIndex(
                name: "IX_GuideAvailabilities_StartDate_EndDate",
                table: "GuideAvailabilities",
                columns: new[] { "StartDate", "EndDate" });

            migrationBuilder.AddForeignKey(
                name: "FK_TourSchedules_Users_GuideUserId",
                table: "TourSchedules",
                column: "GuideUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_TourSchedules_Users_GuideUserId",
                table: "TourSchedules");

            migrationBuilder.DropTable(
                name: "GuideAvailabilities");

            migrationBuilder.DropIndex(
                name: "IX_TourSchedules_GuideUserId",
                table: "TourSchedules");

            migrationBuilder.DropColumn(
                name: "GuideUserId",
                table: "TourSchedules");
        }
    }
}
