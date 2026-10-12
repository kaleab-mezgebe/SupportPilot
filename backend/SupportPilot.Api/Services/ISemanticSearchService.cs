using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services;

public interface ISemanticSearchService
{
    float[] GenerateEmbedding(string text);
    double ComputeCosineSimilarity(float[] vectorA, float[] vectorB);
    Task<List<(KnowledgeArticle Article, double Score)>> SearchSimilarArticlesAsync(string query, int topK = 3, double minScore = 0.35);
}
