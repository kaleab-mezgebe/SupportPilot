using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace SupportPilot.Api.Services.Llm;

public class GeminiLlmProvider : ILlmProvider
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;
    private readonly ILogger<GeminiLlmProvider> _logger;

    public string ProviderName => "GoogleGemini";

    public GeminiLlmProvider(HttpClient httpClient, IConfiguration configuration, ILogger<GeminiLlmProvider> logger)
    {
        _httpClient = httpClient;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<string> GenerateGroundedAnswerAsync(string query, string contextDocumentTitle, string contextContent, List<string> citations)
    {
        var apiKey = _configuration["Llm:GeminiApiKey"] 
                     ?? _configuration["GEMINI_API_KEY"] 
                     ?? Environment.GetEnvironmentVariable("GEMINI_API_KEY");

        if (string.IsNullOrWhiteSpace(apiKey))
        {
            throw new InvalidOperationException("Google Gemini API key is not configured.");
        }

        var model = _configuration["Llm:GeminiModel"] ?? "gemini-1.5-flash";
        var endpoint = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new[]
                    {
                        new
                        {
                            text = $"System: You are SupportPilot AI. Answer the user query using ONLY the given verified article.\nContext [{contextDocumentTitle}]: {contextContent}\nQuestion: {query}"
                        }
                    }
                }
            }
        };

        using var request = new HttpRequestMessage(HttpMethod.Post, endpoint);
        request.Content = new StringContent(JsonSerializer.Serialize(payload), Encoding.UTF8, "application/json");

        var response = await _httpClient.SendAsync(request);
        response.EnsureSuccessStatusCode();

        var responseJson = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(responseJson);
        var content = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString();

        return content ?? $"{contextContent}\n\n(Source: {contextDocumentTitle})";
    }
}
