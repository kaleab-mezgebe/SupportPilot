using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Controllers;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using Xunit;

namespace SupportPilot.UnitTests;

public class TicketsControllerTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        // Seed test data
        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "customer@example.com",
            FullName = "Test Customer",
            Role = UserRole.Customer
        };

        var agent = new User
        {
            Id = Guid.NewGuid(),
            Email = "agent@example.com",
            FullName = "Test Agent",
            Role = UserRole.SupportAgent
        };

        var category = new TicketCategory
        {
            Id = Guid.NewGuid(),
            Name = "General Support"
        };

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = "SP-1001",
            Title = "Initial Ticket",
            Description = "Sample description",
            Priority = TicketPriority.Medium,
            Status = TicketStatus.Open,
            CustomerId = customer.Id,
            Customer = customer,
            AssignedAgentId = agent.Id,
            AssignedAgent = agent,
            CategoryId = category.Id,
            Category = category
        };

        context.Users.AddRange(customer, agent);
        context.TicketCategories.Add(category);
        context.Tickets.Add(ticket);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task GetTickets_ReturnsOkResult_WithListOfTickets()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);

        // Act
        var result = await controller.GetTickets(null, null, null, null, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var tickets = Assert.IsAssignableFrom<IEnumerable<TicketDto>>(okResult.Value);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task CreateTicket_ReturnsCreatedAtActionResult_WithValidTicketReference()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);
        var request = new CreateTicketRequest(
            Title: "Unit test ticket title",
            Description: "Unit test ticket description",
            Priority: TicketPriority.High,
            CategoryName: "General Support",
            CustomerName: "New Customer",
            CustomerEmail: "newcustomer@example.com"
        );

        // Act
        var result = await controller.CreateTicket(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdTicket = Assert.IsType<TicketDto>(createdResult.Value);
        Assert.Equal("Unit test ticket title", createdTicket.Title);
        Assert.StartsWith("SP-", createdTicket.TicketReference);
    }

    [Fact]
    public async Task AddMessage_AppendsMessageToTicketThread()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ticket = await context.Tickets.FirstAsync();
        var controller = new TicketsController(context);

        var request = new AddTicketMessageRequest(
            Content: "This is a new test message",
            IsInternalNote: false,
            IsAiGenerated: false
        );

        // Act
        var result = await controller.AddMessage(ticket.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var messageDto = Assert.IsType<TicketMessageDto>(okResult.Value);
        Assert.Equal("This is a new test message", messageDto.Content);
        Assert.Equal(ticket.Id, messageDto.TicketId);
    }

    [Fact]
    public async Task UpdateStatus_ChangesTicketStatus()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ticket = await context.Tickets.FirstAsync();
        var controller = new TicketsController(context);

        var request = new UpdateTicketStatusRequest(TicketStatus.Resolved);

        // Act
        var result = await controller.UpdateStatus(ticket.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var ticketDto = Assert.IsType<TicketDto>(okResult.Value);
        Assert.Equal("Resolved", ticketDto.Status);
    }
}
