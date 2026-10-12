using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using Xunit;

namespace SupportPilot.IntegrationTests;

public class AuthAndTicketsIntegrationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly HttpClient _client;
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNameCaseInsensitive = true };

    public AuthAndTicketsIntegrationTests(CustomWebApplicationFactory factory)
    {
        _client = factory.CreateClient();
    }

    private async Task<string> AuthenticateAsync(string email, string password)
    {
        var loginResponse = await _client.PostAsJsonAsync("/api/auth/login", new LoginRequest(email, password));
        loginResponse.EnsureSuccessStatusCode();

        var authResult = await loginResponse.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(authResult);
        Assert.False(string.IsNullOrWhiteSpace(authResult.Token));

        return authResult.Token;
    }

    [Fact]
    public async Task HealthCheck_ReturnsHealthyStatus()
    {
        // Act
        var healthResponse = await _client.GetAsync("/health");
        var apiHealthResponse = await _client.GetAsync("/api/health");

        // Assert
        Assert.Equal(HttpStatusCode.OK, healthResponse.StatusCode);
        Assert.Equal(HttpStatusCode.OK, apiHealthResponse.StatusCode);

        var healthContent = await apiHealthResponse.Content.ReadAsStringAsync();
        Assert.Contains("Healthy", healthContent);
    }

    [Fact]
    public async Task Register_CreatesUser_AndReturnsToken()
    {
        // Arrange
        var uniqueEmail = $"integration.test.{Guid.NewGuid():N}@supportpilot.io";
        var request = new RegisterRequest(
            FullName: "Integration Test User",
            Email: uniqueEmail,
            Password: "SecurePassword123!",
            Role: UserRole.Customer,
            OrganizationName: "Acme Corp Testing"
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/register", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(authResult);
        Assert.False(string.IsNullOrWhiteSpace(authResult.Token));
        Assert.Equal(uniqueEmail, authResult.User.Email);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        var request = new LoginRequest("admin@acme.test", "Password123!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var authResult = await response.Content.ReadFromJsonAsync<AuthResponseDto>(JsonOptions);
        Assert.NotNull(authResult);
        Assert.Equal("admin@acme.test", authResult.User.Email);
        Assert.Equal("SystemAdministrator", authResult.User.Role);
    }

    [Fact]
    public async Task Login_WithInvalidCredentials_ReturnsUnauthorized()
    {
        // Arrange
        var request = new LoginRequest("admin@acme.test", "WrongPassword999!");

        // Act
        var response = await _client.PostAsJsonAsync("/api/auth/login", request);

        // Assert
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task CreateTicket_Authenticated_ReturnsCreatedWithSlaTarget()
    {
        // Arrange
        var token = await AuthenticateAsync("customer@acme.test", "Password123!");
        using var requestMessage = new HttpRequestMessage(HttpMethod.Post, "/api/tickets");
        requestMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
        requestMessage.Content = JsonContent.Create(new CreateTicketRequest(
            Title: "Urgent issue with payment integration",
            Description: "Webhooks are failing to deliver with 500 error code.",
            Priority: TicketPriority.Urgent,
            CategoryName: "Billing & Subscriptions"
        ));

        // Act
        var response = await _client.SendAsync(requestMessage);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        var createdTicket = await response.Content.ReadFromJsonAsync<TicketDetailDto>(JsonOptions);
        Assert.NotNull(createdTicket);
        Assert.StartsWith("SP-", createdTicket.TicketReference);
        Assert.Equal("Urgent", createdTicket.Priority);
        Assert.NotNull(createdTicket.FirstResponseDueAtUtc);
        Assert.NotNull(createdTicket.ResolutionDueAtUtc);
    }

    [Fact]
    public async Task EscalateTicketPriority_UpdatesSlaTargets()
    {
        // Arrange
        var agentToken = await AuthenticateAsync("agent@acme.test", "Password123!");
        var ticketId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        using var patchRequest = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{ticketId}/priority");
        patchRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", agentToken);
        patchRequest.Content = JsonContent.Create(new UpdateTicketPriorityRequest(TicketPriority.Urgent));

        // Act
        var response = await _client.SendAsync(patchRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var updatedTicket = await response.Content.ReadFromJsonAsync<TicketDetailDto>(JsonOptions);
        Assert.NotNull(updatedTicket);
        Assert.Equal("Urgent", updatedTicket.Priority);
    }

    [Fact]
    public async Task AddMessage_AppendsMessageToTicket()
    {
        // Arrange
        var agentToken = await AuthenticateAsync("agent@acme.test", "Password123!");
        var ticketId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        using var postMessage = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/messages");
        postMessage.Headers.Authorization = new AuthenticationHeaderValue("Bearer", agentToken);
        postMessage.Content = JsonContent.Create(new AddTicketMessageRequest(
            Content: "We have reviewed your invoice and refunded the overcharged amount.",
            IsInternalNote: false,
            IsAiGenerated: false
        ));

        // Act
        var response = await _client.SendAsync(postMessage);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var messageDto = await response.Content.ReadFromJsonAsync<TicketMessageDto>(JsonOptions);
        Assert.NotNull(messageDto);
        Assert.Contains("refunded", messageDto.Content);
    }

    [Fact]
    public async Task BulkUpdateStatus_UpdatesTickets()
    {
        // Arrange
        var agentToken = await AuthenticateAsync("agent@acme.test", "Password123!");
        var ticketId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        using var bulkRequest = new HttpRequestMessage(HttpMethod.Post, "/api/tickets/bulk-status");
        bulkRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", agentToken);
        bulkRequest.Content = JsonContent.Create(new BulkUpdateStatusRequest(
            TicketIds: new List<Guid> { ticketId },
            Status: TicketStatus.Resolved
        ));

        // Act
        var response = await _client.SendAsync(bulkRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<BulkOperationResultDto>(JsonOptions);
        Assert.NotNull(result);
        Assert.True(result.UpdatedCount >= 1);
    }

    [Fact]
    public async Task RagQuery_ReturnsGroundedAnswerAndCitations()
    {
        // Arrange
        var customerToken = await AuthenticateAsync("customer@acme.test", "Password123!");

        using var ragRequest = new HttpRequestMessage(HttpMethod.Post, "/api/kb/rag");
        ragRequest.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        ragRequest.Content = JsonContent.Create(new RagQueryRequest(
            Query: "What is your refund policy?",
            ConfidenceThreshold: 0.20
        ));

        // Act
        var response = await _client.SendAsync(ragRequest);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var ragAnswer = await response.Content.ReadFromJsonAsync<RagAnswerDto>(JsonOptions);
        Assert.NotNull(ragAnswer);
        Assert.False(string.IsNullOrWhiteSpace(ragAnswer.Answer));
        Assert.NotEmpty(ragAnswer.Citations);
        Assert.True(ragAnswer.ConfidenceScore > 0);
    }

    [Fact]
    public async Task InboundEmailWebhook_CreatesTicketFromEmail()
    {
        // Arrange
        var webhookPayload = new InboundEmailWebhookDto(
            From: "Integration Tester <tester@acme.test>",
            To: "support@supportpilot.io",
            Subject: "Urgent: Payment webhook failure in production",
            BodyText: "Payment gateway received 500 internal server error."
        );

        // Act
        var response = await _client.PostAsJsonAsync("/api/webhooks/inbound-email", webhookPayload);

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var result = await response.Content.ReadFromJsonAsync<InboundEmailResultDto>(JsonOptions);
        Assert.NotNull(result);
        Assert.True(result.Success);
        Assert.StartsWith("TCK-EML-", result.TicketReference);
    }

    [Fact]
    public async Task SubmitCsat_ResolvedTicket_ReturnsSuccessAndPersistsRating()
    {
        // Arrange
        var customerToken = await AuthenticateAsync("customer@acme.test", "Password123!");
        var ticketId = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff");

        // First ensure ticket is marked resolved
        var agentToken = await AuthenticateAsync("agent@acme.test", "Password123!");
        using var resolveReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/tickets/{ticketId}/status");
        resolveReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", agentToken);
        resolveReq.Content = JsonContent.Create(new UpdateTicketStatusRequest(TicketStatus.Resolved));
        var resolveRes = await _client.SendAsync(resolveReq);
        Assert.Equal(HttpStatusCode.OK, resolveRes.StatusCode);

        // Act: Submit 5-star CSAT survey
        using var csatReq = new HttpRequestMessage(HttpMethod.Post, $"/api/tickets/{ticketId}/csat");
        csatReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", customerToken);
        csatReq.Content = JsonContent.Create(new SubmitCsatRequest(
            Rating: 5,
            FeedbackComment: "Speedy and effective resolution!"
        ));
        var csatRes = await _client.SendAsync(csatReq);

        // Assert
        Assert.Equal(HttpStatusCode.OK, csatRes.StatusCode);
        var surveyDto = await csatRes.Content.ReadFromJsonAsync<CsatSurveyDto>(JsonOptions);
        Assert.NotNull(surveyDto);
        Assert.Equal(5, surveyDto.Rating);
        Assert.Equal("Speedy and effective resolution!", surveyDto.FeedbackComment);
    }

    [Fact]
    public async Task IntegrationStatus_ReturnsConfiguration()
    {
        // Act
        var response = await _client.GetAsync("/api/integrations/status");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        var status = await response.Content.ReadFromJsonAsync<IntegrationStatusDto>(JsonOptions);
        Assert.NotNull(status);
        Assert.True(status.EmailInboundActive);
        Assert.False(string.IsNullOrWhiteSpace(status.ActiveLlmProvider));
    }
}
