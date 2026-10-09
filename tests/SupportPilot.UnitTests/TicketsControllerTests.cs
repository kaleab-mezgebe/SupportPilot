using Microsoft.AspNetCore.Mvc;
using SupportPilot.Api.Controllers;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using Xunit;

namespace SupportPilot.UnitTests;

public class TicketsControllerTests
{
    [Fact]
    public void GetTickets_ReturnsOkResult_WithListOfTickets()
    {
        // Arrange
        var controller = new TicketsController();

        // Act
        var result = controller.GetTickets(null, null, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var tickets = Assert.IsAssignableFrom<IEnumerable<TicketDto>>(okResult.Value);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public void CreateTicket_ReturnsCreatedAtActionResult_WithValidTicketReference()
    {
        // Arrange
        var controller = new TicketsController();
        var request = new CreateTicketRequest(
            Title: "Unit test ticket title",
            Description: "Unit test ticket description",
            Priority: TicketPriority.High,
            CustomerName: "Test Customer",
            CustomerEmail: "test@example.com",
            CategoryName: "General Support"
        );

        // Act
        var result = controller.CreateTicket(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdTicket = Assert.IsType<TicketDto>(createdResult.Value);
        Assert.Equal("Unit test ticket title", createdTicket.Title);
        Assert.StartsWith("SP-", createdTicket.TicketReference);
    }
}
