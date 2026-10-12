namespace SupportPilot.Api.Services.Llm;

public interface ILlmProvider
{
    string ProviderName { get; }
    Task<string> GenerateGroundedAnswerAsync(string query, string contextDocumentTitle, string contextContent, List<string> citations);
}
