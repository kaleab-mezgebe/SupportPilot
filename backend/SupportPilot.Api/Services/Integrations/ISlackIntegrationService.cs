using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services.Integrations;

public interface ISlackIntegrationService
{
    Task<bool> SendTicketNotificationAsync(Ticket ticket, string eventType);
    Task<bool> SendSlaAlertAsync(Ticket ticket, string urgency);
    Task<bool> TestWebhookAsync(string webhookUrl, string? customMessage = null);
}
