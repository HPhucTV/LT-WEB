using System;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;
using TravelTour.Api.Data;

#nullable disable

namespace TravelTour.Api.Migrations
{
    [DbContext(typeof(AppDbContext))]
    [Migration("20260516090000_AddTourPromotionDetails")]
    public partial class AddTourPromotionDetails : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateOnly>(
                name: "DiscountEndDate",
                table: "Tours",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<DateOnly>(
                name: "DiscountStartDate",
                table: "Tours",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "PromotionDescription",
                table: "Tours",
                type: "character varying(500)",
                maxLength: 500,
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "PromotionTitle",
                table: "Tours",
                type: "character varying(120)",
                maxLength: 120,
                nullable: false,
                defaultValue: "");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(name: "DiscountEndDate", table: "Tours");
            migrationBuilder.DropColumn(name: "DiscountStartDate", table: "Tours");
            migrationBuilder.DropColumn(name: "PromotionDescription", table: "Tours");
            migrationBuilder.DropColumn(name: "PromotionTitle", table: "Tours");
        }
    }
}
