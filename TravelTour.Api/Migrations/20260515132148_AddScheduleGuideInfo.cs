using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TravelTour.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddScheduleGuideInfo : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GuideName",
                table: "TourSchedules",
                type: "character varying(120)",
                maxLength: 120,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Note",
                table: "TourSchedules",
                type: "character varying(500)",
                maxLength: 500,
                nullable: true);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GuideName",
                table: "TourSchedules");

            migrationBuilder.DropColumn(
                name: "Note",
                table: "TourSchedules");
        }
    }
}
