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

        var avgResponseTime = responseTimes.Count > 0 ? (int)Math.Round(responseTimes.Average()) : 0;

        // Real CSAT calculation from database
        var csatSurveys = await _dbContext.CsatSurveys.ToListAsync();
        var csatSatisfactionRate = csatSurveys.Count > 0
            ? (int)Math.Round((double)csatSurveys.Count(s => s.Rating >= 4) / csatSurveys.Count * 100)
            : 0;

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
            CustomerSatisfactionRate: csatSatisfactionRate,
            RecentTickets: recentTickets
        );

        return Ok(stats);
    }

    [HttpGet("csat")]
    public async Task<ActionResult<CsatMetricsDto>> GetCsatMetrics()
    {
        var surveys = await _dbContext.CsatSurveys
            .Include(c => c.Customer)
            .Include(c => c.Ticket)
            .OrderByDescending(c => c.SubmittedAtUtc)
            .ToListAsync();

        if (surveys.Count == 0)
        {
            return Ok(new CsatMetricsDto(
                AverageRating: 0.0,
                TotalResponses: 0,
                SatisfactionPercentage: 0.0,
                RatingDistribution: new Dictionary<string, int>
                {
                    { "5", 0 },
                    { "4", 0 },
                    { "3", 0 },
                    { "2", 0 },
                    { "1", 0 }
                },
                RecentFeedback: new List<CsatSurveyDto>()
            ));
        }

        var avgRating = Math.Round(surveys.Average(s => s.Rating), 1);
        var satisfiedCount = surveys.Count(s => s.Rating >= 4);
        var satisfactionPct = Math.Round((double)satisfiedCount / surveys.Count * 100, 1);

        var distribution = new Dictionary<string, int>
        {
            { "5", surveys.Count(s => s.Rating == 5) },
            { "4", surveys.Count(s => s.Rating == 4) },
            { "3", surveys.Count(s => s.Rating == 3) },
            { "2", surveys.Count(s => s.Rating == 2) },
            { "1", surveys.Count(s => s.Rating == 1) }
        };

        var recent = surveys.Take(10).Select(s => new CsatSurveyDto(
            s.Id,
            s.TicketId,
            s.Ticket?.TicketReference ?? "TCK-UNKNOWN",
            s.CustomerId,
            s.Customer?.FullName ?? "Customer",
            s.Rating,
            s.FeedbackComment,
            s.SubmittedAtUtc
        )).ToList();

        return Ok(new CsatMetricsDto(
            AverageRating: avgRating,
            TotalResponses: surveys.Count,
            SatisfactionPercentage: satisfactionPct,
            RatingDistribution: distribution,
            RecentFeedback: recent
        ));
    }

    [HttpGet("analytics")]
    public async Task<ActionResult<AnalyticsOverviewDto>> GetAnalyticsOverview()
    {
        var totalTickets = await _dbContext.Tickets.CountAsync();
        var now = DateTime.UtcNow;

        // 1. Response Times
        var responseMinutes = await _dbContext.Tickets
            .Where(t => t.FirstResponseAtUtc != null)
            .Select(t => (t.FirstResponseAtUtc!.Value - t.CreatedAtUtc).TotalMinutes)
            .ToListAsync();

        var avgMinutes = responseMinutes.Count > 0 ? (int)Math.Round(responseMinutes.Average()) : 0;
        var formattedResponse = avgMinutes >= 60 
            ? $"{avgMinutes / 60}h {avgMinutes % 60}m" 
            : avgMinutes > 0 
                ? $"{avgMinutes}m" 
                : "< 1m";

        // 2. SLA Compliance Rate
        var breachedCount = await _dbContext.Tickets
            .CountAsync(t => t.IsSlaBreached || (t.ResolutionDueAtUtc != null && t.ResolutionDueAtUtc < now && t.ResolvedAtUtc == null));
        
        var slaComplianceRate = totalTickets > 0 
            ? Math.Round((double)(totalTickets - breachedCount) / totalTickets * 100, 1) 
            : 100.0;

        // 3. CSAT Metrics
        var surveys = await _dbContext.CsatSurveys.ToListAsync();
        var avgCsat = surveys.Count > 0 ? Math.Round(surveys.Average(s => s.Rating), 1) : 0.0;
        var csatPct = surveys.Count > 0 ? Math.Round((double)surveys.Count(s => s.Rating >= 4) / surveys.Count * 100, 1) : 0.0;

        // 4. AI Deflection Rate
        var totalMessages = await _dbContext.TicketMessages.CountAsync();
        var aiMessages = await _dbContext.TicketMessages.CountAsync(m => m.IsAiGenerated);
        var aiDeflectionRate = totalMessages > 0 ? Math.Round((double)aiMessages / totalMessages * 100, 1) : 0.0;

        // 5. Category Breakdown
        var categories = await _dbContext.TicketCategories.ToListAsync();
        var ticketsWithCat = await _dbContext.Tickets.Include(t => t.Category).ToListAsync();

        var categoryMetrics = categories.Select(c =>
        {
            var count = ticketsWithCat.Count(t => t.CategoryId == c.Id);
            var pct = totalTickets > 0 ? Math.Round((double)count / totalTickets * 100, 1) : 0.0;
            return new CategoryMetricDto(
                Name: c.Name,
                Count: count,
                Percentage: pct,
                ColorHex: c.ColorHex
            );
        }).OrderByDescending(c => c.Count).ToList();

        // 6. Recent Activity from Audit Logs
        var rawLogs = await _dbContext.AuditLogs
            .OrderByDescending(a => a.TimestampUtc)
            .Take(6)
            .ToListAsync();

        var userIds = rawLogs.Where(l => l.UserId.HasValue).Select(l => l.UserId!.Value).Distinct().ToList();
        var usersMap = await _dbContext.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, u => u.FullName);

        var recentActivity = rawLogs.Select(l => new AuditLogItemDto(
            Id: l.Id,
            Action: l.Action,
            ActorName: l.UserId.HasValue && usersMap.TryGetValue(l.UserId.Value, out var name) ? name : "System Service",
            TimestampUtc: l.TimestampUtc
        )).ToList();

        return Ok(new AnalyticsOverviewDto(
            AvgFirstResponseFormatted: formattedResponse,
            AvgFirstResponseMinutes: avgMinutes,
            SlaComplianceRate: slaComplianceRate,
            CsatAverageRating: avgCsat,
            CsatSatisfactionPercentage: csatPct,
            CsatTotalCount: surveys.Count,
            AiDeflectionRate: aiDeflectionRate,
            AiDeflectedCount: aiMessages,
            CategoryBreakdown: categoryMetrics,
            RecentActivity: recentActivity
        ));
    }
}
