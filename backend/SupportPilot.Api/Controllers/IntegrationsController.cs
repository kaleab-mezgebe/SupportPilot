using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Services.Integrations;
using SupportPilot.Api.Services.Llm;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class IntegrationsController : ControllerBase
{
    private readonly ISlackIntegrationService _slackService;
    private readonly ILlmProvider _llmProvider;
    private readonly IConfiguration _configuration;

    public IntegrationsController(
        ISlackIntegrationService slackService,
        ILlmProvider llmProvider,
        IConfiguration configuration)
    {
        _slackService = slackService;
        _llmProvider = llmProvider;
        _configuration = configuration;
    }

    [HttpGet("status")]
    public ActionResult<IntegrationStatusDto> GetStatus()
    {
        var slackConfigured = !string.IsNullOrWhiteSpace(_configuration["Integrations:SlackWebhookUrl"]
                              ?? _configuration["SLACK_WEBHOOK_URL"]
                              ?? Environment.GetEnvironmentVariable("SLACK_WEBHOOK_URL"));

        return Ok(new IntegrationStatusDto(
            SlackConfigured: slackConfigured,
            EmailInboundActive: true,
            ActiveLlmProvider: _llmProvider.ProviderName,
            TimestampUtc: DateTime.UtcNow
        ));
    }

    [HttpPost("slack/test")]
    public async Task<IActionResult> TestSlackWebhook([FromBody] SlackWebhookTestRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.WebhookUrl))
        {
            return BadRequest(new { success = false, message = "Webhook URL must not be empty." });
        }

        var success = await _slackService.TestWebhookAsync(request.WebhookUrl, request.Message);
        if (success)
        {
            return Ok(new { success = true, message = "Slack test notification successfully delivered!" });
        }

        return StatusCode(502, new { success = false, message = "Failed to reach Slack webhook endpoint. Check the URL and webhook permissions." });
    }
}
