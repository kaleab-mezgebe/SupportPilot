using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services.Email;

public class EmailNotificationService : IEmailNotificationService
{
    private readonly ILogger<EmailNotificationService> _logger;
    private readonly IConfiguration _configuration;

    public EmailNotificationService(ILogger<EmailNotificationService> logger, IConfiguration configuration)
    {
        _logger = logger;
        _configuration = configuration;
    }

    public Task SendTicketCreatedNotificationAsync(Ticket ticket)
    {
        var recipient = ticket.Customer?.Email ?? "customer@unknown.io";
        var subject = $"[SupportPilot] #{ticket.TicketReference}: {ticket.Title}";
        var body = $"Hello {ticket.Customer?.FullName ?? "Customer"},\n\n" +
                   $"Your support request has been registered under reference [{ticket.TicketReference}].\n" +
                   $"Priority: {ticket.Priority}\n" +
                   $"Status: {ticket.Status}\n\n" +
                   $"You can reply directly to this email or access your portal to track progress.\n\n" +
                   $"- SupportPilot Automated Service";

        _logger.LogInformation("EMAIL_DISPATCH [TICKET_CREATED] To: {Recipient} | Subject: {Subject}", recipient, subject);
        return Task.CompletedTask;
    }

    public Task SendTicketReplyNotificationAsync(Ticket ticket, TicketMessage message)
    {
        var recipient = message.SenderId == ticket.CustomerId
            ? (ticket.AssignedAgent?.Email ?? "support@supportpilot.io")
            : (ticket.Customer?.Email ?? "customer@unknown.io");

        var subject = $"Re: [SupportPilot] #{ticket.TicketReference}: {ticket.Title}";
        var body = $"New message from {message.Sender?.FullName ?? "Support Team"}:\n\n" +
                   $"{message.Content}\n\n" +
                   $"View thread: /tickets/{ticket.Id}";

        _logger.LogInformation("EMAIL_DISPATCH [TICKET_REPLY] To: {Recipient} | Subject: {Subject}", recipient, subject);
        return Task.CompletedTask;
    }

    public Task SendSlaBreachWarningAsync(Ticket ticket)
    {
        var recipient = ticket.AssignedAgent?.Email ?? "team-leads@supportpilot.io";
        var subject = $"⚠️ SLA WARNING: Ticket #{ticket.TicketReference} Approaching Breach";
        var body = $"Urgent attention required: Ticket #{ticket.TicketReference} ({ticket.Title})\n" +
                   $"Resolution Due: {ticket.ResolutionDueAtUtc:yyyy-MM-dd HH:mm:ss} UTC\n" +
                   $"Priority: {ticket.Priority}";

        _logger.LogWarning("EMAIL_DISPATCH [SLA_BREACH_WARNING] To: {Recipient} | Subject: {Subject}", recipient, subject);
        return Task.CompletedTask;
    }
}
