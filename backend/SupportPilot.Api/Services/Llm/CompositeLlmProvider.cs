using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SupportPilot.Api.Services.Llm;

public class CompositeLlmProvider : ILlmProvider
{
    private readonly LocalDenseLlmProvider _localProvider;
    private readonly OpenAiLlmProvider _openAiProvider;
    private readonly GeminiLlmProvider _geminiProvider;
    private readonly IConfiguration _configuration;
    private readonly ILogger<CompositeLlmProvider> _logger;

    public CompositeLlmProvider(
        LocalDenseLlmProvider localProvider,
        OpenAiLlmProvider openAiProvider,
        GeminiLlmProvider geminiProvider,
        IConfiguration configuration,
        ILogger<CompositeLlmProvider> logger)
    {
        _localProvider = localProvider;
        _openAiProvider = openAiProvider;
        _geminiProvider = geminiProvider;
        _configuration = configuration;
        _logger = logger;
    }

    public string ProviderName
    {
        get
        {
            var requested = (_configuration["Llm:Provider"] ?? "local").ToLowerInvariant();
            if (requested == "openai" && HasKey("Llm:OpenAiApiKey", "OPENAI_API_KEY")) return "OpenAI";
            if (requested == "gemini" && HasKey("Llm:GeminiApiKey", "GEMINI_API_KEY")) return "GoogleGemini";
            return "LocalDenseModel";
        }
    }

    public async Task<string> GenerateGroundedAnswerAsync(string query, string contextDocumentTitle, string contextContent, List<string> citations)
    {
        var requested = (_configuration["Llm:Provider"] ?? "local").ToLowerInvariant();

        try
        {
            if (requested == "openai" && HasKey("Llm:OpenAiApiKey", "OPENAI_API_KEY"))
            {
                return await _openAiProvider.GenerateGroundedAnswerAsync(query, contextDocumentTitle, contextContent, citations);
            }

            if (requested == "gemini" && HasKey("Llm:GeminiApiKey", "GEMINI_API_KEY"))
            {
                return await _geminiProvider.GenerateGroundedAnswerAsync(query, contextDocumentTitle, contextContent, citations);
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "External LLM call failed. Falling back to local dense knowledge model.");
        }

        // Always fallback cleanly to local dense model
        return await _localProvider.GenerateGroundedAnswerAsync(query, contextDocumentTitle, contextContent, citations);
    }

    private bool HasKey(string configKey, string envKey)
    {
        var key = _configuration[configKey] ?? _configuration[envKey] ?? Environment.GetEnvironmentVariable(envKey);
        return !string.IsNullOrWhiteSpace(key);
    }
}
