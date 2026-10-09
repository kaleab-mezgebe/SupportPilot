using Microsoft.AspNetCore.Mvc;
using SupportPilot.Api.DTOs;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    private readonly IHostEnvironment _env;

    public HealthController(IHostEnvironment env)
    {
        _env = env;
    }

    [HttpGet]
    public ActionResult<HealthStatusDto> Get()
    {
        return Ok(new HealthStatusDto(
            Status: "Healthy",
            ServiceName: "SupportPilot API",
            Version: "1.0.0-preview",
            Environment: _env.EnvironmentName,
            TimestampUtc: DateTime.UtcNow
        ));
    }
}
