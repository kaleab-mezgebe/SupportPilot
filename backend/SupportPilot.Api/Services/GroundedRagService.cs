using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;

using SupportPilot.Api.Services.Llm;

namespace SupportPilot.Api.Services;

public class GroundedRagService : IGroundedRagService
{
    private readonly ISemanticSearchService _semanticSearchService;
    private readonly AppDbContext _dbContext;
    private readonly ILlmProvider _llmProvider;

    public GroundedRagService(
        ISemanticSearchService semanticSearchService, 
        AppDbContext dbContext,
        ILlmProvider? llmProvider = null)
    {
        _semanticSearchService = semanticSearchService;
        _dbContext = dbContext;
        _llmProvider = llmProvider ?? new LocalDenseLlmProvider();
    }

    public async Task<RagAnswerDto> GenerateAnswerAsync(string query, double threshold = 0.50)
    {
        if (string.IsNullOrWhiteSpace(query))
        {
            return new RagAnswerDto(
                Query: query,
                Answer: "Please provide a question or topic to search.",
                ConfidenceScore: 0.0,
                IsGrounded: false,
                Citations: new List<RagCitationDto>(),
                EscalationReason: "Empty query provided."
            );
        }

        var matches = await _semanticSearchService.SearchSimilarArticlesAsync(query, topK: 3, minScore: 0.20);

        if (matches.Count == 0 || matches[0].Score < threshold)
        {
            var bestScore = matches.Count > 0 ? matches[0].Score : 0.0;
            return new RagAnswerDto(
                Query: query,
                Answer: "I could not find verified documentation to answer this question with sufficient confidence. To prevent unsupported answers, this ticket has been routed to a human support agent.",
                ConfidenceScore: bestScore,
                IsGrounded: false,
                Citations: matches.Select(m => new RagCitationDto(
                    ArticleId: m.Article.Id,
                    Title: m.Article.Title,
                    Slug: m.Article.Slug,
                    Category: m.Article.Category,
                    RelevanceScore: m.Score,
                    Excerpt: ExtractRelevantExcerpt(m.Article.Content, query)
                )).ToList(),
                EscalationReason: $"Relevance score ({bestScore:P0}) is below the required confidence threshold ({threshold:P0})."
            );
        }

        var topArticle = matches[0].Article;
        var topScore = matches[0].Score;

        var citations = matches.Select(m => new RagCitationDto(
            ArticleId: m.Article.Id,
            Title: m.Article.Title,
            Slug: m.Article.Slug,
            Category: m.Article.Category,
            RelevanceScore: m.Score,
            Excerpt: ExtractRelevantExcerpt(m.Article.Content, query)
        )).ToList();

        // Synthesize grounded response using active LLM provider (external OpenAI/Gemini or local dense fallback)
        var citationList = citations.Select(c => $"[{c.Title}] (Confidence: {c.RelevanceScore:P0})").ToList();
        var synthesizedAnswer = await _llmProvider.GenerateGroundedAnswerAsync(
            query,
            topArticle.Title,
            topArticle.Content,
            citationList
        );

        return new RagAnswerDto(
            Query: query,
            Answer: synthesizedAnswer,
            ConfidenceScore: topScore,
            IsGrounded: true,
            Citations: citations,
            EscalationReason: null
        );
    }

    public async Task<CopilotSuggestionDto> GenerateCopilotSuggestionAsync(Guid ticketId)
    {
        var ticket = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == ticketId);

        if (ticket == null)
        {
            throw new KeyNotFoundException("Ticket not found.");
        }

        var query = $"{ticket.Title} {ticket.Description}";
        var matches = await _semanticSearchService.SearchSimilarArticlesAsync(query, topK: 2, minScore: 0.25);

        if (matches.Count == 0)
        {
            return new CopilotSuggestionDto(
                TicketId: ticket.Id,
                SuggestedResponse: "Hi there, thank you for reaching out. We are currently reviewing your request with our engineering team and will follow up shortly.",
                SourceArticleTitle: "General Escalation Template",
                ConfidenceScore: 0.30,
                Citations: new List<string>()
            );
        }

        var top = matches[0];
        var excerpt = ExtractRelevantExcerpt(top.Article.Content, query);

        var draft = $"Hi {ticket.Customer?.FullName ?? "there"},\n\n" +
            $"Regarding your inquiry on '{ticket.Title}':\n\n" +
            $"According to our documentation for {top.Article.Title}:\n" +
            $"{excerpt}\n\n" +
            $"Please let us know if you need further assistance with this setup!";

        return new CopilotSuggestionDto(
            TicketId: ticket.Id,
            SuggestedResponse: draft,
            SourceArticleTitle: top.Article.Title,
            ConfidenceScore: top.Score,
            Citations: matches.Select(m => $"{m.Article.Title} ({m.Score:P0})").ToList()
        );
    }

    private static string ExtractRelevantExcerpt(string content, string query)
    {
        if (string.IsNullOrWhiteSpace(content)) return string.Empty;
        if (content.Length <= 240) return content;

        var sentences = content.Split(new[] { ". ", "! ", "? " }, StringSplitOptions.RemoveEmptyEntries);
        var queryTerms = query.ToLowerInvariant().Split(' ').Where(t => t.Length > 3).ToList();

        foreach (var sentence in sentences)
        {
            var lower = sentence.ToLowerInvariant();
            if (queryTerms.Any(term => lower.Contains(term)))
            {
                return sentence.Trim() + ".";
            }
        }

        return content.Substring(0, Math.Min(220, content.Length)).Trim() + "...";
    }
}
