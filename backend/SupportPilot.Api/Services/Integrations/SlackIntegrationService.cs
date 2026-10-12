using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services.Integrations;

public class SlackIntegrationService : ISlackIntegrationService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<SlackIntegrationService> _logger;

    public SlackIntegrationService(HttpClient httpClient, IConfiguration configuration, ILogger<SlackIntegrationService> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    private string? GetConfiguredWebhookUrl()
    {
        return _configuration["Integrations:SlackWebhookUrl"]
               ?? _configuration["SLACK_WEBHOOK_URL"]
               ?? Environment.GetEnvironmentVariable("SLACK_WEBHOOK_URL");
    }

    public async Task<bool> SendTicketNotificationAsync(Ticket ticket, string eventType)
    {
        var webhookUrl = GetConfiguredWebhookUrl();
        if (string.IsNullOrWhiteSpace(webhookUrl))
        {
            _logger.LogInformation("Slack notification skipped: SLACK_WEBHOOK_URL not configured. Ticket: {Ref}", ticket.TicketReference);
            return false;
        }

        var emoji = ticket.Priority switch
        {
            TicketPriority.Urgent => "🚨",
            TicketPriority.High => "⚠️",
            _ => "🎫"
        };

        var payload = new
        {
            text = $"{emoji} *SupportPilot Notification*: {eventType} - #{ticket.TicketReference}",
            blocks = new object[]
            {
                new
                {
                    type = "section",
                    text = new
                    {
                        type = "mrkdwn",
                        text = $"{emoji} *{eventType}*: *<{ticket.TicketReference}>* - {ticket.Title}\n" +
                               $"*Priority:* `{ticket.Priority}` | *Status:* `{ticket.Status}` | *Customer:* {ticket.Customer?.FullName ?? "Unknown"}"
                    }
                },
                new
                {
                    type = "context",
                    elements = new object[]
                    {
                        new
                        {
                            type = "mrkdwn",
                            text = $"Resolution SLA Due: {ticket.ResolutionDueAtUtc:yyyy-MM-dd HH:mm:ss} UTC"
                        }
                    }
                }
            }
        };

        return await PostPayloadAsync(webhookUrl, payload);
    }

    public async Task<bool> SendSlaAlertAsync(Ticket ticket, string urgency)
    {
        var webhookUrl = GetConfiguredWebhookUrl();
        if (string.IsNullOrWhiteSpace(webhookUrl)) return false;

        var payload = new
        {
            text = $"🔥 *SLA ALERT ({urgency})*: Ticket #{ticket.TicketReference} has breached or is about to breach its target SLA!",
            blocks = new object[]
            {
                new
                {
                    type = "section",
                    text = new
                    {
                        type = "mrkdwn",
                        text = $"🔥 *SLA {urgency} Alert*: Ticket *#{ticket.TicketReference}*\n" +
                               $"*Subject:* {ticket.Title}\n" +
                               $"*Assigned Agent:* {ticket.AssignedAgent?.FullName ?? "Unassigned"}\n" +
                               $"*Priority:* `{ticket.Priority}` | *SLA Due:* {ticket.ResolutionDueAtUtc:yyyy-MM-dd HH:mm:ss} UTC"
                    }
                }
            }
        };

        return await PostPayloadAsync(webhookUrl, payload);
    }

    public async Task<bool> TestWebhookAsync(string webhookUrl, string? customMessage = null)
    {
        if (string.IsNullOrWhiteSpace(webhookUrl)) return false;

        var payload = new
        {
            text = customMessage ?? "✅ SupportPilot Slack Webhook Integration verified successfully! Instant notifications are now active."
        };

        return await PostPayloadAsync(webhookUrl, payload);
    }

    private async Task<bool> PostPayloadAsync(string webhookUrl, object payload)
    {
        try
        {
            var json = JsonSerializer.Serialize(payload);
            using var content = new StringContent(json, Encoding.UTF8, "application/json");
            var response = await _httpClient.PostAsync(webhookUrl, content);
            return response.IsSuccessStatusCode;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed sending webhook payload to Slack URL: {Url}", webhookUrl);
            return false;
        }
    }
}
