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
            Category = category,
            CreatedAtUtc = DateTime.UtcNow
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
        var result = await controller.GetTickets(null, null, null, null, null, null, null);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var tickets = Assert.IsAssignableFrom<IEnumerable<TicketDto>>(okResult.Value);
        Assert.NotEmpty(tickets);
    }

    [Fact]
    public async Task CreateTicket_ReturnsCreatedAtActionResult_WithValidSlaDeadlines()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);
        var request = new CreateTicketRequest(
            Title: "Urgent Outage Investigation",
            Description: "Production database unreachable",
            Priority: TicketPriority.Urgent,
            CategoryName: "General Support",
            CustomerName: "New Customer",
            CustomerEmail: "newcustomer@example.com"
        );

        // Act
        var result = await controller.CreateTicket(request);

        // Assert
        var createdResult = Assert.IsType<CreatedAtActionResult>(result.Result);
        var createdTicket = Assert.IsType<TicketDto>(createdResult.Value);
        Assert.Equal("Urgent Outage Investigation", createdTicket.Title);
        Assert.StartsWith("SP-", createdTicket.TicketReference);
        Assert.NotNull(createdTicket.FirstResponseDueAtUtc);
        Assert.NotNull(createdTicket.ResolutionDueAtUtc);
        // Urgent should have first response due within ~1 hour
        Assert.True(createdTicket.FirstResponseDueAtUtc <= DateTime.UtcNow.AddMinutes(65));
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

    [Fact]
    public async Task BulkUpdateStatus_UpdatesMultipleTickets()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);
        var existingTicket = await context.Tickets.FirstAsync();

        var ticket2 = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = "SP-1002",
            Title = "Second Ticket",
            Description = "Another issue",
            Priority = TicketPriority.Low,
            Status = TicketStatus.Open,
            CustomerId = existingTicket.CustomerId
        };
        context.Tickets.Add(ticket2);
        await context.SaveChangesAsync();

        var request = new BulkUpdateStatusRequest(
            TicketIds: new List<Guid> { existingTicket.Id, ticket2.Id },
            Status: TicketStatus.Resolved
        );

        // Act
        var result = await controller.BulkUpdateStatus(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var bulkResult = Assert.IsType<BulkOperationResultDto>(okResult.Value);
        Assert.Equal(2, bulkResult.UpdatedCount);

        var reloaded1 = await context.Tickets.FindAsync(existingTicket.Id);
        var reloaded2 = await context.Tickets.FindAsync(ticket2.Id);
        Assert.Equal(TicketStatus.Resolved, reloaded1!.Status);
        Assert.Equal(TicketStatus.Resolved, reloaded2!.Status);
    }

    [Fact]
    public async Task BulkAssign_AssignsAgentToMultipleTickets()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);
        var agent = await context.Users.FirstAsync(u => u.Role == UserRole.SupportAgent);
        var existingTicket = await context.Tickets.FirstAsync();

        var ticket2 = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = "SP-1003",
            Title = "Third Ticket",
            Description = "Third issue",
            Priority = TicketPriority.Medium,
            Status = TicketStatus.Open,
            CustomerId = existingTicket.CustomerId,
            AssignedAgentId = null
        };
        context.Tickets.Add(ticket2);
        await context.SaveChangesAsync();

        var request = new BulkAssignRequest(
            TicketIds: new List<Guid> { existingTicket.Id, ticket2.Id },
            AgentId: agent.Id
        );

        // Act
        var result = await controller.BulkAssign(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var bulkResult = Assert.IsType<BulkOperationResultDto>(okResult.Value);
        Assert.Equal(2, bulkResult.UpdatedCount);

        var reloaded2 = await context.Tickets.FindAsync(ticket2.Id);
        Assert.Equal(agent.Id, reloaded2!.AssignedAgentId);
    }

    [Fact]
    public async Task UpdatePriority_RecalculatesSlaTargets()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var controller = new TicketsController(context);
        var ticket = await context.Tickets.FirstAsync();

        var request = new UpdateTicketPriorityRequest(TicketPriority.Urgent);

        // Act
        var result = await controller.UpdatePriority(ticket.Id, request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var dto = Assert.IsType<TicketDto>(okResult.Value);
        Assert.Equal("Urgent", dto.Priority);
        Assert.NotNull(dto.FirstResponseDueAtUtc);
        Assert.NotNull(dto.ResolutionDueAtUtc);
    }
}
