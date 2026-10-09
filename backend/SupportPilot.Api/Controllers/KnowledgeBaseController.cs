using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/kb")]
public class KnowledgeBaseController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public KnowledgeBaseController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
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
}
