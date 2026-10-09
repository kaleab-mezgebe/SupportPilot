using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public DashboardController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    [HttpGet("stats")]
    public async Task<ActionResult<DashboardStatsDto>> GetDashboardStats()
    {
        var totalTickets = await _dbContext.Tickets.CountAsync();
        var openTickets = await _dbContext.Tickets.CountAsync(t => t.Status == TicketStatus.Open);
        var inProgressTickets = await _dbContext.Tickets.CountAsync(t => t.Status == TicketStatus.InProgress);
        var resolvedTickets = await _dbContext.Tickets.CountAsync(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);

        var recentTickets = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(5)
            .Select(t => new TicketDto(
                t.Id,
                t.TicketReference,
                t.Title,
                t.Description,
                t.Priority.ToString(),
                t.Status.ToString(),
                t.Category != null ? t.Category.Name : null,
                t.Customer != null ? t.Customer.FullName : "Customer",
                t.Customer != null ? t.Customer.Email : "",
                t.AssignedAgent != null ? t.AssignedAgent.FullName : null,
                t.CreatedAtUtc,
                t.UpdatedAtUtc,
                t.Messages.Count
            ))
            .ToListAsync();

        var stats = new DashboardStatsDto(
            TotalTickets: totalTickets,
            OpenTickets: openTickets,
            InProgressTickets: inProgressTickets,
            ResolvedTickets: resolvedTickets,
            AvgResponseTimeMinutes: 14,
            CustomerSatisfactionRate: 98,
            RecentTickets: recentTickets
        );

        return Ok(stats);
    }
}
