using System.Net;
using System.Net.Mail;
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

    public async Task SendTicketCreatedNotificationAsync(Ticket ticket)
    {
        var recipient = ticket.Customer?.Email ?? "customer@unknown.io";
        var subject = $"[SupportPilot] #{ticket.TicketReference}: {ticket.Title}";
        var body = $"Hello {ticket.Customer?.FullName ?? "Customer"},\n\n" +
                   $"Your support request has been registered under reference [{ticket.TicketReference}].\n" +
                   $"Priority: {ticket.Priority}\n" +
                   $"Status: {ticket.Status}\n\n" +
                   $"You can reply directly to this email or access your portal to track progress.\n\n" +
                   $"- SupportPilot Automated Service";

        await SendEmailAsync(recipient, subject, body, "TICKET_CREATED");
    }

    public async Task SendTicketReplyNotificationAsync(Ticket ticket, TicketMessage message)
    {
        var recipient = message.SenderId == ticket.CustomerId
            ? (ticket.AssignedAgent?.Email ?? "support@supportpilot.io")
            : (ticket.Customer?.Email ?? "customer@unknown.io");

        var subject = $"Re: [SupportPilot] #{ticket.TicketReference}: {ticket.Title}";
        var body = $"New message from {message.Sender?.FullName ?? "Support Team"}:\n\n" +
                   $"{message.Content}\n\n" +
                   $"View thread: /tickets/{ticket.Id}";

        await SendEmailAsync(recipient, subject, body, "TICKET_REPLY");
    }

    public async Task SendSlaBreachWarningAsync(Ticket ticket)
    {
        var recipient = ticket.AssignedAgent?.Email ?? "team-leads@supportpilot.io";
        var subject = $"⚠️ SLA WARNING: Ticket #{ticket.TicketReference} Approaching Breach";
        var body = $"Urgent attention required: Ticket #{ticket.TicketReference} ({ticket.Title})\n" +
                   $"Resolution Due: {ticket.ResolutionDueAtUtc:yyyy-MM-dd HH:mm:ss} UTC\n" +
                   $"Priority: {ticket.Priority}";

        await SendEmailAsync(recipient, subject, body, "SLA_BREACH_WARNING");
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body, string contextTag)
    {
        var host = _configuration["Smtp:Host"] 
                   ?? _configuration["SMTP_HOST"] 
                   ?? Environment.GetEnvironmentVariable("SMTP_HOST");

        // If SMTP host is not configured, run simulated dispatch with structured logging
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogInformation("EMAIL_DISPATCH [{Tag}] Simulated To: {Recipient} | Subject: {Subject}", contextTag, toEmail, subject);
            return;
        }

        try
        {
            var portStr = _configuration["Smtp:Port"] 
                          ?? _configuration["SMTP_PORT"] 
                          ?? Environment.GetEnvironmentVariable("SMTP_PORT") 
                          ?? "587";
            if (!int.TryParse(portStr, out var port) || port <= 0) port = 587;

            var user = _configuration["Smtp:Username"] 
                       ?? _configuration["SMTP_USERNAME"] 
                       ?? Environment.GetEnvironmentVariable("SMTP_USERNAME");
            var pass = _configuration["Smtp:Password"] 
                       ?? _configuration["SMTP_PASSWORD"] 
                       ?? Environment.GetEnvironmentVariable("SMTP_PASSWORD");

            var sslStr = _configuration["Smtp:EnableSsl"] 
                         ?? _configuration["SMTP_ENABLE_SSL"] 
                         ?? Environment.GetEnvironmentVariable("SMTP_ENABLE_SSL") 
                         ?? "true";
            bool.TryParse(sslStr, out var enableSsl);

            var fromEmail = _configuration["Smtp:FromEmail"] 
                            ?? _configuration["SMTP_FROM_EMAIL"] 
                            ?? Environment.GetEnvironmentVariable("SMTP_FROM_EMAIL") 
                            ?? "support@supportpilot.io";
            var fromName = _configuration["Smtp:FromName"] 
                           ?? _configuration["SMTP_FROM_NAME"] 
                           ?? Environment.GetEnvironmentVariable("SMTP_FROM_NAME") 
                           ?? "SupportPilot Support";

            using var mailMessage = new MailMessage
            {
                From = new MailAddress(fromEmail, fromName),
                Subject = subject,
                Body = body,
                IsBodyHtml = false
            };
            mailMessage.To.Add(toEmail);

            using var client = new SmtpClient(host, port)
            {
                EnableSsl = enableSsl,
                Timeout = 10000
            };

            if (!string.IsNullOrWhiteSpace(user) && !string.IsNullOrWhiteSpace(pass))
            {
                client.Credentials = new NetworkCredential(user, pass);
            }

            await client.SendMailAsync(mailMessage);
            _logger.LogInformation("EMAIL_DISPATCH_SUCCESS [{Tag}] Delivered via SMTP ({Host}:{Port}) to {Recipient}", contextTag, host, port, toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "EMAIL_DISPATCH_FAILURE [{Tag}] SMTP delivery failed to {Recipient}. Falling back to simulation.", contextTag, toEmail);
        }
    }
}
