using Microsoft.AspNetCore.Mvc;
using SupportPilot.Api.DTOs;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DashboardController : ControllerBase
{
    [HttpGet("stats")]
    public ActionResult<DashboardStatsDto> GetStats()
    {
        return Ok(new DashboardStatsDto(
            TotalTickets: 142,
            OpenTickets: 24,
            InProgressTickets: 18,
            ResolvedTickets: 100,
            AvgResponseTimeMinutes: 14,
            CustomerSatisfactionRate: 98,
            RecentTickets: new List<TicketDto>()
        ));
    }
}
