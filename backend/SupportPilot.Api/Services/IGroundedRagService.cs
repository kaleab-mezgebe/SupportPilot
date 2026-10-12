using SupportPilot.Api.DTOs;

namespace SupportPilot.Api.Services;

public interface IGroundedRagService
{
    Task<RagAnswerDto> GenerateAnswerAsync(string query, double threshold = 0.50);
    Task<CopilotSuggestionDto> GenerateCopilotSuggestionAsync(Guid ticketId);
}
