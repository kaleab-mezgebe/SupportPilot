using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging.Abstractions;
using SupportPilot.Api.Controllers;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services.Email;
using SupportPilot.Api.Services.Integrations;
using SupportPilot.Api.Services.Llm;
using Xunit;

namespace SupportPilot.UnitTests;

public class Sprint9EnhancementTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "SupportPilot HQ",
            Slug = "supportpilot-hq"
        };
        context.Organizations.Add(org);

        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "customer@example.com",
            FullName = "Customer Test",
            Role = UserRole.Customer,
            OrganizationId = org.Id
        };
        context.Users.Add(customer);

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = "TCK-20261012-TEST",
            Title = "API Webhook Failures",
            Description = "Our webhooks stopped firing.",
            Status = TicketStatus.Resolved,
            Priority = TicketPriority.High,
            CustomerId = customer.Id,
            OrganizationId = org.Id
        };
        context.Tickets.Add(ticket);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public async Task LocalDenseLlmProvider_GeneratesGroundedAnswer()
    {
        // Arrange
        var provider = new LocalDenseLlmProvider();

        // Act
        var answer = await provider.GenerateGroundedAnswerAsync(
            query: "How do I setup SSL?",
            contextDocumentTitle: "SSL Setup Guide",
            contextContent: "Add a CNAME record and certs will auto-issue.",
            citations: new List<string> { "SSL Setup Guide" }
        );

        // Assert
        Assert.NotNull(answer);
        Assert.Contains("SSL Setup Guide", answer);
        Assert.Contains("CNAME record", answer);
        Assert.Equal("LocalEmbeddingModel", provider.ProviderName);
    }

    [Fact]
    public async Task WebhooksController_InboundEmail_CreatesNewTicket()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = new ConfigurationBuilder().Build();
        var emailService = new EmailNotificationService(NullLogger<EmailNotificationService>.Instance, config);
        var httpClient = new HttpClient();
        var slackService = new SlackIntegrationService(httpClient, config, NullLogger<SlackIntegrationService>.Instance);
        var controller = new WebhooksController(context, emailService, slackService, NullLogger<WebhooksController>.Instance);

        var inbound = new InboundEmailWebhookDto(
            From: "New Customer <newcustomer@example.com>",
            To: "support@supportpilot.io",
            Subject: "Urgent issue with production payments",
            BodyText: "All card payments are failing with code 500."
        );

        // Act
        var result = await controller.HandleInboundEmail(inbound);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<InboundEmailResultDto>(okResult.Value);
        Assert.True(payload.Success);
        Assert.Equal("created_ticket", payload.Action);
        Assert.StartsWith("TCK-EML-", payload.TicketReference);

        var created = await context.Tickets.FirstOrDefaultAsync(t => t.TicketReference == payload.TicketReference);
        Assert.NotNull(created);
        Assert.Equal(TicketPriority.Urgent, created.Priority);
    }

    [Fact]
    public async Task WebhooksController_InboundEmail_AppendsReplyToExistingTicket()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var config = new ConfigurationBuilder().Build();
        var emailService = new EmailNotificationService(NullLogger<EmailNotificationService>.Instance, config);
        var httpClient = new HttpClient();
        var slackService = new SlackIntegrationService(httpClient, config, NullLogger<SlackIntegrationService>.Instance);
        var controller = new WebhooksController(context, emailService, slackService, NullLogger<WebhooksController>.Instance);

        var inbound = new InboundEmailWebhookDto(
            From: "customer@example.com",
            To: "support@supportpilot.io",
            Subject: "Re: [SupportPilot] #TCK-20261012-TEST: Followup question",
            BodyText: "Thank you for the quick resolution, could you verify our retry count?"
        );

        // Act
        var result = await controller.HandleInboundEmail(inbound);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var payload = Assert.IsType<InboundEmailResultDto>(okResult.Value);
        Assert.True(payload.Success);
        Assert.Equal("appended_reply", payload.Action);
        Assert.Equal("TCK-20261012-TEST", payload.TicketReference);

        var messages = await context.TicketMessages.Where(m => m.TicketId == payload.TicketId).ToListAsync();
        Assert.NotEmpty(messages);
        Assert.Contains("retry count", messages.Last().Content);
    }

    [Fact]
    public async Task SubmitCsat_ResolvedTicket_RecordsRatingAndFeedback()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ticket = await context.Tickets.FirstAsync();
        var controller = new TicketsController(context, new NullLogger<TicketsController>());

        var csatRequest = new SubmitCsatRequest(
            Rating: 5,
            FeedbackComment: "Outstanding support from the pilot team!"
        );

        // Act
        var result = await controller.SubmitCsat(ticket.Id, csatRequest);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var surveyDto = Assert.IsType<CsatSurveyDto>(okResult.Value);
        Assert.Equal(5, surveyDto.Rating);
        Assert.Equal("Outstanding support from the pilot team!", surveyDto.FeedbackComment);

        var saved = await context.CsatSurveys.FirstOrDefaultAsync(s => s.TicketId == ticket.Id);
        Assert.NotNull(saved);
        Assert.Equal(5, saved.Rating);
    }

    [Fact]
    public async Task DashboardController_GetCsatMetrics_CalculatesSatisfactionRates()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var ticket = await context.Tickets.FirstAsync();
        context.CsatSurveys.Add(new CsatSurvey
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            CustomerId = ticket.CustomerId,
            Rating = 5,
            FeedbackComment = "Fast response time!"
        });
        await context.SaveChangesAsync();

        var controller = new DashboardController(context);

        // Act
        var result = await controller.GetCsatMetrics();

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var metrics = Assert.IsType<CsatMetricsDto>(okResult.Value);
        Assert.Equal(5.0, metrics.AverageRating);
        Assert.Equal(1, metrics.TotalResponses);
        Assert.Equal(100.0, metrics.SatisfactionPercentage);
        Assert.NotEmpty(metrics.RecentFeedback);
    }
}
