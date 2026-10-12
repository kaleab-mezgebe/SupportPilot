using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SupportPilot.Api.Services.Llm;

public class OpenAiLlmProvider : ILlmProvider
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<OpenAiLlmProvider> _logger;

    public string ProviderName => "OpenAI";

    public OpenAiLlmProvider(HttpClient httpClient, IConfiguration configuration, ILogger<OpenAiLlmProvider> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateGroundedAnswerAsync(string query, string contextDocumentTitle, string contextContent, List<string> citations)
    {
        var apiKey = _configuration["Llm:OpenAiApiKey"] 
                     ?? _configuration["OPENAI_API_KEY"] 
                     ?? Environment.GetEnvironmentVariable("OPENAI_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("OpenAI API key is not configured.");
        }

        var model = _configuration["Llm:OpenAiModel"] ?? "gpt-4o-mini";
        var endpoint = _configuration["Llm:OpenAiEndpoint"] ?? "https://api.openai.com/v1/chat/completions";

        var payload = new
        {
            model = model,
            messages = new[]
            {
                new
                {
                    role = "system",
                    content = "You are SupportPilot, an enterprise support AI. Answer the user's question accurately using ONLY the provided verified documentation excerpt. If the excerpt doesn't fully answer, say so clearly and do not hallucinate."
                },
                new
                {
                    role = "user",
                    content = $"Question: {query}\n\nDocumentation [{contextDocumentTitle}]:\n{contextContent}\n\nPlease generate a polite, concise grounded reply citing [{contextDocumentTitle}]."
                }
            },
            temperature = 0.2
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);
        var content = doc.RootElement
            .GetProperty("choices")[0]
            .GetProperty("message")
            .GetProperty("content")
            .GetString();

        return content ?? $"{contextContent}\n\n(Source: {contextDocumentTitle})";
    }
}
