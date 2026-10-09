using Microsoft.AspNetCore.Mvc;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private static readonly List<TicketDto> SampleTickets = new()
    {
        new TicketDto(
            Id: Guid.Parse("11111111-1111-1111-1111-111111111111"),
            TicketReference: "SP-1042",
            Title: "Unable to connect custom domain to workspace",
            Description: "I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out.",
            Priority: "High",
            Status: "Open",
            CategoryName: "Configuration & DNS",
            CustomerName: "Sarah Connor",
            CustomerEmail: "sarah@cyberdyne.io",
            AssignedAgentName: "Alex Rivera",
            CreatedAtUtc: DateTime.UtcNow.AddHours(-2),
            UpdatedAtUtc: DateTime.UtcNow.AddMinutes(-15),
            MessageCount: 3
        ),
        new TicketDto(
            Id: Guid.Parse("22222222-2222-2222-2222-222222222222"),
            TicketReference: "SP-1041",
            Title: "Billing inquiry: invoice receipt VAT id missing",
            Description: "Need updated invoice with EU VAT ID for Q3 accounting period.",
            Priority: "Medium",
            Status: "InProgress",
            CategoryName: "Billing",
            CustomerName: "Marcus Vance",
            CustomerEmail: "marcus@helios.tech",
            AssignedAgentName: "Emma Watson",
            CreatedAtUtc: DateTime.UtcNow.AddHours(-6),
            UpdatedAtUtc: DateTime.UtcNow.AddHours(-1),
            MessageCount: 4
        ),
        new TicketDto(
            Id: Guid.Parse("33333333-3333-3333-3333-333333333333"),
            TicketReference: "SP-1040",
            Title: "AI Knowledge Base sync fails on large markdown docs",
            Description: "When syncing 500+ kb documentation, the vector ingestion job returns timeout 504.",
            Priority: "Urgent",
            Status: "Open",
            CategoryName: "AI & Integrations",
            CustomerName: "David Chen",
            CustomerEmail: "david@neuroflow.ai",
            AssignedAgentName: null,
            CreatedAtUtc: DateTime.UtcNow.AddHours(-12),
            UpdatedAtUtc: null,
            MessageCount: 1
        ),
        new TicketDto(
            Id: Guid.Parse("44444444-4444-4444-4444-444444444444"),
            TicketReference: "SP-1039",
            Title: "How to export ticket history to CSV?",
            Description: "Looking for an automated way to export weekly resolved tickets for reporting.",
            Priority: "Low",
            Status: "Resolved",
            CategoryName: "General Support",
            CustomerName: "Elena Rostova",
            CustomerEmail: "elena@vanguard.co",
            AssignedAgentName: "Alex Rivera",
            CreatedAtUtc: DateTime.UtcNow.AddDays(-1),
            UpdatedAtUtc: DateTime.UtcNow.AddHours(-3),
            MessageCount: 5
        )
    };

    [HttpGet]
    public ActionResult<IEnumerable<TicketDto>> GetTickets([FromQuery] string? status, [FromQuery] string? priority, [FromQuery] string? search)
    {
        var query = SampleTickets.AsEnumerable();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            query = query.Where(t => t.Status.Equals(status, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(priority) && priority != "All")
        {
            query = query.Where(t => t.Priority.Equals(priority, StringComparison.OrdinalIgnoreCase));
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(t =>
                t.Title.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                t.TicketReference.Contains(search, StringComparison.OrdinalIgnoreCase) ||
                t.CustomerName.Contains(search, StringComparison.OrdinalIgnoreCase));
        }

        return Ok(query.ToList());
    }

    [HttpGet("{id:guid}")]
    public ActionResult<TicketDto> GetById(Guid id)
    {
        var ticket = SampleTickets.FirstOrDefault(t => t.Id == id);
        if (ticket == null) return NotFound(new { message = "Ticket not found" });
        return Ok(ticket);
    }

    [HttpPost]
    public ActionResult<TicketDto> CreateTicket([FromBody] CreateTicketRequest request)
    {
        var newTicket = new TicketDto(
            Id: Guid.NewGuid(),
            TicketReference: $"SP-{1040 + SampleTickets.Count + 1}",
            Title: request.Title,
            Description: request.Description,
            Priority: request.Priority.ToString(),
            Status: "Open",
            CategoryName: request.CategoryName ?? "General Support",
            CustomerName: request.CustomerName,
            CustomerEmail: request.CustomerEmail,
            AssignedAgentName: null,
            CreatedAtUtc: DateTime.UtcNow,
            UpdatedAtUtc: null,
            MessageCount: 1
        );

        SampleTickets.Insert(0, newTicket);
        return CreatedAtAction(nameof(GetById), new { id = newTicket.Id }, newTicket);
    }
}
