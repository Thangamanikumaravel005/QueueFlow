using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace QueueFlow.API.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerIdToQueue : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "CustomerId",
                table: "QueueItems",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CustomerId",
                table: "QueueItems");
        }
    }
}
