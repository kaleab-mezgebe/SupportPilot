using System.Security.Cryptography;
using System.Text;
using System.Text.RegularExpressions;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services;

public class SemanticSearchService : ISemanticSearchService
{
    private const int Dimensions = 128;
    private readonly AppDbContext _dbContext;

    public SemanticSearchService(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    /// <summary>
    /// Generates a normalized 128-dimensional dense embedding vector from text using subword semantic hashing.
    /// </summary>
    public float[] GenerateEmbedding(string text)
    {
        var vector = new float[Dimensions];
        if (string.IsNullOrWhiteSpace(text)) return vector;

        // Tokenize and clean text
        var normalized = text.ToLowerInvariant();
        var words = Regex.Split(normalized, @"\W+").Where(w => w.Length > 1).ToList();
        if (words.Count == 0) return vector;

        // Stopwords to downweight
        var stopWords = new HashSet<string> { "the", "and", "a", "an", "in", "on", "to", "for", "of", "with", "at", "by", "is", "it" };

        foreach (var word in words)
        {
            var weight = stopWords.Contains(word) ? 0.3f : 1.0f;

            // Whole word hash projection
            var wordHash = Math.Abs(GetStableHash(word)) % Dimensions;
            vector[wordHash] += weight * 1.5f;

            // Character trigrams for subword semantic capture (e.g. "domain", "ssl", "custom")
            if (word.Length >= 3)
            {
                for (int i = 0; i <= word.Length - 3; i++)
                {
                    var trigram = word.Substring(i, 3);
                    var triHash = Math.Abs(GetStableHash(trigram)) % Dimensions;
                    vector[triHash] += weight * 0.5f;
                }
            }
        }

        // L2 Unit Normalization
        double sumSq = 0;
        for (int i = 0; i < Dimensions; i++)
        {
            sumSq += vector[i] * vector[i];
        }

        if (sumSq > 0)
        {
            var norm = (float)Math.Sqrt(sumSq);
            for (int i = 0; i < Dimensions; i++)
            {
                vector[i] /= norm;
            }
        }

        return vector;
    }

    /// <summary>
    /// Calculates Cosine Similarity between two normalized vectors (-1.0 to 1.0).
    /// </summary>
    public double ComputeCosineSimilarity(float[] vectorA, float[] vectorB)
    {
        if (vectorA == null || vectorB == null || vectorA.Length != vectorB.Length) return 0.0;

        double dotProduct = 0;
        for (int i = 0; i < vectorA.Length; i++)
        {
            dotProduct += vectorA[i] * vectorB[i];
        }

        return Math.Clamp(dotProduct, 0.0, 1.0);
    }

    /// <summary>
    /// Searches published knowledge articles ranked by cosine similarity against the query vector.
    /// </summary>
    public async Task<List<(KnowledgeArticle Article, double Score)>> SearchSimilarArticlesAsync(
        string query, 
        int topK = 3, 
        double minScore = 0.35)
    {
        var queryEmbedding = GenerateEmbedding(query);
        var articles = await _dbContext.KnowledgeArticles
            .Where(a => a.IsPublished)
            .ToListAsync();

        var ranked = new List<(KnowledgeArticle Article, double Score)>();

        foreach (var article in articles)
        {
            var embedding = article.GetEmbedding();
            if (embedding == null)
            {
                // Generate and cache embedding on the fly if missing
                embedding = GenerateEmbedding($"{article.Title} {article.Category} {article.Content}");
                article.SetEmbedding(embedding);
            }

            var score = ComputeCosineSimilarity(queryEmbedding, embedding);

            // Also check keyword token matches to boost exact matches
            var queryLower = query.ToLowerInvariant();
            if (article.Title.ToLowerInvariant().Contains(queryLower))
            {
                score = Math.Min(1.0, score + 0.25);
            }

            if (score >= minScore)
            {
                ranked.Add((article, Math.Round(score, 3)));
            }
        }

        await _dbContext.SaveChangesAsync();

        return ranked
            .OrderByDescending(x => x.Score)
            .Take(topK)
            .ToList();
    }

    private static int GetStableHash(string str)
    {
        using var md5 = MD5.Create();
        var bytes = md5.ComputeHash(Encoding.UTF8.GetBytes(str));
        return BitConverter.ToInt32(bytes, 0);
    }
}
