using System.Text.RegularExpressions;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;
using SupportPilot.Api.Services.Email;
using SupportPilot.Api.Services.Integrations;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailNotificationService _emailService;
    private readonly ISlackIntegrationService _slackService;
    private readonly ILogger<WebhooksController> _logger;

    public WebhooksController(
        AppDbContext context,
        IEmailNotificationService emailService,
        ISlackIntegrationService slackService,
        ILogger<WebhooksController> logger)
    {
        _context = context;
        _emailService = emailService;
        _slackService = slackService;
        _logger = logger;
    }

    [HttpPost("inbound-email")]
    public async Task<ActionResult<InboundEmailResultDto>> HandleInboundEmail([FromBody] InboundEmailWebhookDto payload)
    {
        if (string.IsNullOrWhiteSpace(payload.From) || string.IsNullOrWhiteSpace(payload.Subject))
        {
            return BadRequest(new InboundEmailResultDto(
                Success: false,
                Action: "rejected",
                TicketReference: string.Empty,
                TicketId: Guid.Empty,
                Message: "Inbound email must include valid From and Subject fields."
            ));
        }

        var senderEmail = ExtractEmailAddress(payload.From);
        var subject = payload.Subject.Trim();
        var content = !string.IsNullOrWhiteSpace(payload.BodyText) ? payload.BodyText.Trim() : (payload.BodyHtml ?? "No content.");

        // Check if subject references an existing ticket (e.g. TCK-20261012-001 or TCK-TEST-001)
        var ticketMatch = Regex.Match(subject, @"TCK-[A-Za-z0-9\-]+", RegexOptions.IgnoreCase);
        if (ticketMatch.Success)
        {
            var ticketRef = ticketMatch.Value.ToUpperInvariant();
            var existingTicket = await _context.Tickets
                .Include(t => t.Customer)
                .Include(t => t.AssignedAgent)
                .FirstOrDefaultAsync(t => t.TicketReference == ticketRef);

            if (existingTicket != null)
            {
                // Find or link sender
                var senderUser = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == senderEmail.ToLower());
                if (senderUser == null)
                {
                    senderUser = new User
                    {
                        Id = Guid.NewGuid(),
                        Email = senderEmail,
                        FullName = ExtractDisplayName(payload.From),
                        Role = UserRole.Customer,
                        OrganizationId = existingTicket.OrganizationId,
                        CreatedAtUtc = DateTime.UtcNow
                    };
                    _context.Users.Add(senderUser);
                    await _context.SaveChangesAsync();
                }

                var replyMessage = new TicketMessage
                {
                    Id = Guid.NewGuid(),
                    TicketId = existingTicket.Id,
                    SenderId = senderUser.Id,
                    Content = content,
                    IsInternalNote = false,
                    IsAiGenerated = false,
                    CreatedAtUtc = DateTime.UtcNow
                };

                _context.TicketMessages.Add(replyMessage);
                existingTicket.UpdatedAtUtc = DateTime.UtcNow;

                // Reopen ticket if customer replies to a resolved ticket
                if (existingTicket.Status == TicketStatus.Resolved && senderUser.Id == existingTicket.CustomerId)
                {
                    existingTicket.Status = TicketStatus.InProgress;
                }

                await _context.SaveChangesAsync();
                await _emailService.SendTicketReplyNotificationAsync(existingTicket, replyMessage);

                return Ok(new InboundEmailResultDto(
                    Success: true,
                    Action: "appended_reply",
                    TicketReference: existingTicket.TicketReference,
                    TicketId: existingTicket.Id,
                    Message: $"Reply successfully appended to ticket {existingTicket.TicketReference}."
                ));
            }
        }

        // Create new Ticket from Inbound Email
        var org = await _context.Organizations.FirstOrDefaultAsync();
        var customer = await _context.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == senderEmail.ToLower());
        if (customer == null)
        {
            customer = new User
            {
                Id = Guid.NewGuid(),
                Email = senderEmail,
                FullName = ExtractDisplayName(payload.From),
                Role = UserRole.Customer,
                OrganizationId = org?.Id,
                CreatedAtUtc = DateTime.UtcNow
            };
            _context.Users.Add(customer);
            await _context.SaveChangesAsync();
        }

        var newRef = $"TCK-EML-{DateTime.UtcNow:yyyyMMdd}-{Guid.NewGuid().ToString("N")[..4].ToUpper()}";
        var priority = subject.Contains("urgent", StringComparison.OrdinalIgnoreCase) || subject.Contains("emergency", StringComparison.OrdinalIgnoreCase)
            ? TicketPriority.Urgent
            : TicketPriority.Medium;

        var newTicket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = newRef,
            Title = subject,
            Description = content,
            Priority = priority,
            Status = TicketStatus.Open,
            CustomerId = customer.Id,
            OrganizationId = org?.Id,
            CreatedAtUtc = DateTime.UtcNow
        };
        SlaPolicy.ApplySlaTargets(newTicket);

        _context.Tickets.Add(newTicket);
        await _context.SaveChangesAsync();

        await _emailService.SendTicketCreatedNotificationAsync(newTicket);

        if (priority == TicketPriority.Urgent || priority == TicketPriority.High)
        {
            await _slackService.SendTicketNotificationAsync(newTicket, "New Urgent Inbound Email");
        }

        return Ok(new InboundEmailResultDto(
            Success: true,
            Action: "created_ticket",
            TicketReference: newTicket.TicketReference,
            TicketId: newTicket.Id,
            Message: $"New ticket created from inbound email under reference {newTicket.TicketReference}."
        ));
    }

    private static string ExtractEmailAddress(string input)
    {
        var match = Regex.Match(input, @"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}");
        return match.Success ? match.Value : input.Trim();
    }

    private static string ExtractDisplayName(string input)
    {
        var match = Regex.Match(input, @"^([^<]+)<");
        if (match.Success) return match.Groups[1].Value.Trim().Trim('"');
        var email = ExtractEmailAddress(input);
        return email.Split('@')[0];
    }
}
