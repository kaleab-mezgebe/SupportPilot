using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;
using Xunit;

namespace SupportPilot.UnitTests;

public class RagServiceTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        var context = new AppDbContext(options);

        var article1 = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Configuring Custom Domains & SSL Termination",
            Slug = "configuring-custom-domains-ssl",
            Category = "Configuration & DNS",
            Content = "To point your custom domain to SupportPilot, create a CNAME record pointing to proxy.supportpilot.io. Automated Let's Encrypt SSL certificates are issued within 15 minutes of DNS propagation validation.",
            IsPublished = true
        };

        var article2 = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Billing Invoices and VAT Numbers",
            Slug = "billing-invoices-vat-numbers",
            Category = "Billing",
            Content = "Invoices are generated on the 1st of each month. Update your tax ID under Billing settings for VAT exemption.",
            IsPublished = true
        };

        context.KnowledgeArticles.AddRange(article1, article2);
        context.SaveChanges();

        return context;
    }

    [Fact]
    public void GenerateEmbedding_ProducesNormalizedUnitVector()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var searchService = new SemanticSearchService(context);

        // Act
        var vector = searchService.GenerateEmbedding("custom domain DNS setup");

        // Assert
        Assert.NotNull(vector);
        Assert.Equal(128, vector.Length);

        // Length of unit vector should be ~1.0
        double sumSq = 0;
        foreach (var val in vector) sumSq += val * val;
        var magnitude = Math.Sqrt(sumSq);
        Assert.True(Math.Abs(magnitude - 1.0) < 0.01);
    }

    [Fact]
    public void ComputeCosineSimilarity_IdenticalVectors_ReturnsOne()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var searchService = new SemanticSearchService(context);
        var v1 = searchService.GenerateEmbedding("SupportPilot SSL CNAME configuration");

        // Act
        var score = searchService.ComputeCosineSimilarity(v1, v1);

        // Assert
        Assert.True(Math.Abs(score - 1.0) < 0.001);
    }

    [Fact]
    public async Task GenerateAnswer_RelevantQuery_ReturnsGroundedAnswerWithCitations()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var searchService = new SemanticSearchService(context);
        var ragService = new GroundedRagService(searchService, context);

        // Act
        var result = await ragService.GenerateAnswerAsync("How do I configure my custom domain CNAME and SSL?");

        // Assert
        Assert.True(result.IsGrounded);
        Assert.True(result.ConfidenceScore >= 0.50);
        Assert.NotEmpty(result.Citations);
        Assert.Contains("Custom Domains", result.Citations[0].Title);
        Assert.Null(result.EscalationReason);
    }

    [Fact]
    public async Task GenerateAnswer_UnrelatedQuery_TriggersThresholdEscalation()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var searchService = new SemanticSearchService(context);
        var ragService = new GroundedRagService(searchService, context);

        // Act - completely unrelated query not in KB
        var result = await ragService.GenerateAnswerAsync("What is the recipe for chocolate chip banana bread?", threshold: 0.60);

        // Assert
        Assert.False(result.IsGrounded);
        Assert.NotNull(result.EscalationReason);
        Assert.Contains("human support agent", result.Answer);
    }
}
