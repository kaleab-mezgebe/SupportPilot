using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/kb")]
public class KnowledgeBaseController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IGroundedRagService _ragService;
    private readonly ISemanticSearchService _semanticSearchService;

    public KnowledgeBaseController(
        AppDbContext dbContext,
        IGroundedRagService ragService,
        ISemanticSearchService semanticSearchService)
    {
        _dbContext = dbContext;
        _ragService = ragService;
        _semanticSearchService = semanticSearchService;
    }

    [HttpGet("articles")]
    public async Task<ActionResult<IEnumerable<KnowledgeArticleDto>>> GetArticles([FromQuery] string? search, [FromQuery] string? category)
    {
        var query = _dbContext.KnowledgeArticles.Where(a => a.IsPublished);

        if (!string.IsNullOrWhiteSpace(category) && category != "All")
        {
            query = query.Where(a => a.Category == category);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            query = query.Where(a =>
                a.Title.ToLower().Contains(search.ToLower()) ||
                a.Content.ToLower().Contains(search.ToLower()) ||
                a.Category.ToLower().Contains(search.ToLower()));
        }

        var articles = await query
            .OrderByDescending(a => a.CreatedAtUtc)
            .Select(a => new KnowledgeArticleDto(
                a.Id,
                a.Title,
                a.Slug,
                a.Content,
                a.Category,
                a.IsPublished,
                a.ViewCount,
                a.CreatedAtUtc,
                a.UpdatedAtUtc
            ))
            .ToListAsync();

        return Ok(articles);
    }

    [HttpGet("articles/{id:guid}")]
    public async Task<ActionResult<KnowledgeArticleDto>> GetById(Guid id)
    {
        var article = await _dbContext.KnowledgeArticles.FindAsync(id);
        if (article == null) return NotFound(new { message = "Article not found" });

        article.ViewCount++;
        await _dbContext.SaveChangesAsync();

        return Ok(new KnowledgeArticleDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.Category,
            article.IsPublished,
            article.ViewCount,
            article.CreatedAtUtc,
            article.UpdatedAtUtc
        ));
    }

    [HttpPost("articles")]
    public async Task<ActionResult<KnowledgeArticleDto>> CreateArticle([FromBody] CreateKnowledgeArticleRequest request)
    {
        var slug = request.Title.ToLowerInvariant()
            .Replace(" ", "-")
            .Replace("&", "and")
            .Replace("?", "")
            .Replace("/", "-");

        var article = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Slug = slug,
            Content = request.Content,
            Category = request.Category,
            IsPublished = request.IsPublished,
            ViewCount = 0,
            CreatedAtUtc = DateTime.UtcNow
        };

        // Precompute vector embedding
        var embedding = _semanticSearchService.GenerateEmbedding($"{article.Title} {article.Category} {article.Content}");
        article.SetEmbedding(embedding);

        _dbContext.KnowledgeArticles.Add(article);
        await _dbContext.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = article.Id }, new KnowledgeArticleDto(
            article.Id,
            article.Title,
            article.Slug,
            article.Content,
            article.Category,
            article.IsPublished,
            article.ViewCount,
            article.CreatedAtUtc,
            article.UpdatedAtUtc
        ));
    }

    // --- Sprint 6: Semantic Vector Search & Grounded RAG Endpoints ---

    /// <summary>
    /// Executes semantic cosine similarity search across knowledge base articles.
    /// </summary>
    [HttpGet("semantic-search")]
    public async Task<ActionResult<IEnumerable<SemanticSearchArticleDto>>> SemanticSearch(
        [FromQuery] string q,
        [FromQuery] double? minScore = 0.35,
        [FromQuery] int? topK = 5)
    {
        if (string.IsNullOrWhiteSpace(q))
        {
            return BadRequest(new { message = "Query parameter 'q' is required." });
        }

        var results = await _semanticSearchService.SearchSimilarArticlesAsync(
            q, 
            topK: topK ?? 5, 
            minScore: minScore ?? 0.35
        );

        var dtos = results.Select(r => new SemanticSearchArticleDto(
            Id: r.Article.Id,
            Title: r.Article.Title,
            Slug: r.Article.Slug,
            Category: r.Article.Category,
            Excerpt: r.Article.Content.Length > 200 ? r.Article.Content.Substring(0, 197) + "..." : r.Article.Content,
            RelevanceScore: r.Score
        )).ToList();

        return Ok(dtos);
    }

    /// <summary>
    /// Generates grounded answers using retrieved KB documentation with confidence thresholds and source citations.
    /// </summary>
    [HttpPost("rag")]
    public async Task<ActionResult<RagAnswerDto>> GenerateRagAnswer([FromBody] RagQueryRequest request)
    {
        var response = await _ragService.GenerateAnswerAsync(request.Query, request.ConfidenceThreshold);
        return Ok(response);
    }

    /// <summary>
    /// Generates a co-pilot grounded response suggestion for a support ticket thread.
    /// </summary>
    [HttpGet("copilot-suggest/{ticketId:guid}")]
    public async Task<ActionResult<CopilotSuggestionDto>> GetCopilotSuggestion(Guid ticketId)
    {
        try
        {
            var suggestion = await _ragService.GenerateCopilotSuggestionAsync(ticketId);
            return Ok(suggestion);
        }
        catch (KeyNotFoundException)
        {
            return NotFound(new { message = "Ticket not found." });
        }
    }

    /// <summary>
    /// Re-indexes all published knowledge articles by generating fresh vector embeddings.
    /// </summary>
    [HttpPost("reindex")]
    public async Task<ActionResult> ReindexEmbeddings()
    {
        var articles = await _dbContext.KnowledgeArticles.Where(a => a.IsPublished).ToListAsync();
        foreach (var article in articles)
        {
            var embedding = _semanticSearchService.GenerateEmbedding($"{article.Title} {article.Category} {article.Content}");
            article.SetEmbedding(embedding);
        }

        await _dbContext.SaveChangesAsync();
        return Ok(new { message = $"Successfully re-indexed {articles.Count} knowledge articles." });
    }
}
