using SupportPilot.Api.DTOs;

namespace SupportPilot.Api.Services;

public interface IGroundedRagService
{
    Task<RagAnswerDto> GenerateAnswerAsync(string query, double threshold = 0.55);
    Task<CopilotSuggestionDto> GenerateCopilotSuggestionAsync(Guid ticketId);
}
