using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

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

        var responseTimes = await _dbContext.Tickets
            .Where(t => t.FirstResponseAtUtc != null)
            .Select(t => (t.FirstResponseAtUtc!.Value - t.CreatedAtUtc).TotalMinutes)
            .ToListAsync();

        var avgResponseTime = responseTimes.Count > 0 ? (int)Math.Round(responseTimes.Average()) : 18;

        var recentTicketEntities = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .OrderByDescending(t => t.CreatedAtUtc)
            .Take(5)
            .ToListAsync();

        var now = DateTime.UtcNow;
        var recentTickets = recentTicketEntities.Select(t => new TicketDto(
            t.Id,
            t.TicketReference,
            t.Title,
            t.Description,
            t.Priority.ToString(),
            t.Status.ToString(),
            t.Category?.Name,
            t.Customer?.FullName ?? "Customer",
            t.Customer?.Email ?? "",
            t.AssignedAgent?.FullName,
            t.CreatedAtUtc,
            t.UpdatedAtUtc,
            t.Messages.Count,
            t.FirstResponseDueAtUtc,
            t.ResolutionDueAtUtc,
            t.FirstResponseAtUtc,
            SlaPolicy.EvaluateBreach(t, now)
        )).ToList();

        var stats = new DashboardStatsDto(
            TotalTickets: totalTickets,
            OpenTickets: openTickets,
            InProgressTickets: inProgressTickets,
            ResolvedTickets: resolvedTickets,
            AvgResponseTimeMinutes: avgResponseTime,
            CustomerSatisfactionRate: 98,
            RecentTickets: recentTickets
        );

        return Ok(stats);
    }
}
