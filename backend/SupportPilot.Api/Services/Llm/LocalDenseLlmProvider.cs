namespace SupportPilot.Api.Services.Llm;

public class LocalDenseLlmProvider : ILlmProvider
{
    public string ProviderName => "LocalEmbeddingModel";

    public Task<string> GenerateGroundedAnswerAsync(string query, string contextDocumentTitle, string contextContent, List<string> citations)
    {
        var refs = citations.Count > 0 ? string.Join(", ", citations) : contextDocumentTitle;
        var synthesized = $"Based on verified SupportPilot knowledge base article [{contextDocumentTitle}]:\n\n" +
                          $"{contextContent.Trim()}\n\n" +
                          $"References: {refs}";
        return Task.FromResult(synthesized);
    }
}
