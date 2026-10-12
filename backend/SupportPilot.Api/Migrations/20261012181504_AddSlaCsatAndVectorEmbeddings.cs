using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SupportPilot.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSlaCsatAndVectorEmbeddings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FirstResponseAtUtc",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "FirstResponseDueAtUtc",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsSlaBreached",
                table: "Tickets",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateTime>(
                name: "ResolutionDueAtUtc",
                table: "Tickets",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "EmbeddingJson",
                table: "KnowledgeArticles",
                type: "text",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CsatSurveys",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TicketId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    Rating = table.Column<int>(type: "integer", nullable: false),
                    FeedbackComment = table.Column<string>(type: "text", nullable: true),
                    SubmittedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CsatSurveys", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CsatSurveys_Tickets_TicketId",
                        column: x => x.TicketId,
                        principalTable: "Tickets",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CsatSurveys_Users_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CsatSurveys_CustomerId",
                table: "CsatSurveys",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CsatSurveys_TicketId",
                table: "CsatSurveys",
                column: "TicketId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CsatSurveys");

            migrationBuilder.DropColumn(
                name: "FirstResponseAtUtc",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "FirstResponseDueAtUtc",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "IsSlaBreached",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "ResolutionDueAtUtc",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "EmbeddingJson",
                table: "KnowledgeArticles");
        }
    }
}
