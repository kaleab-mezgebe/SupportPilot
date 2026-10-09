using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        await context.Database.MigrateAsync();

        if (await context.Users.AnyAsync())
        {
            return; // Already seeded
        }

        var passwordHasher = new PasswordHasher();
        var defaultPasswordHash = passwordHasher.HashPassword("Password123!");

        var org = new Organization
        {
            Id = Guid.NewGuid(),
            Name = "SupportPilot HQ",
            Slug = "supportpilot-hq",
            CreatedAtUtc = DateTime.UtcNow
        };
        context.Organizations.Add(org);

        var admin = new User
        {
            Id = Guid.NewGuid(),
            Email = "admin@supportpilot.io",
            FullName = "System Administrator",
            PasswordHash = defaultPasswordHash,
            Role = UserRole.SystemAdministrator,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        var agent = new User
        {
            Id = Guid.NewGuid(),
            Email = "alex.rivera@supportpilot.io",
            FullName = "Alex Rivera",
            PasswordHash = defaultPasswordHash,
            Role = UserRole.SupportAgent,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        var customer = new User
        {
            Id = Guid.NewGuid(),
            Email = "sarah@cyberdyne.io",
            FullName = "Sarah Connor",
            PasswordHash = defaultPasswordHash,
            Role = UserRole.Customer,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        context.Users.AddRange(admin, agent, customer);

        var catDns = new TicketCategory
        {
            Id = Guid.NewGuid(),
            Name = "Configuration & DNS",
            Description = "Custom domain, CNAME, SSL validation issues",
            ColorHex = "#6366f1",
            IsActive = true
        };
        var catBilling = new TicketCategory
        {
            Id = Guid.NewGuid(),
            Name = "Billing & Subscriptions",
            Description = "Invoices, VAT numbers, plan upgrades",
            ColorHex = "#06b6d4",
            IsActive = true
        };
        var catAi = new TicketCategory
        {
            Id = Guid.NewGuid(),
            Name = "AI & Knowledge Retrieval",
            Description = "RAG queries, documentation embeddings, fallback sync",
            ColorHex = "#8b5cf6",
            IsActive = true
        };

        context.TicketCategories.AddRange(catDns, catBilling, catAi);

        var sampleTicket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = "SP-1001",
            Title = "Unable to connect custom domain to workspace",
            Description = "I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out.",
            Priority = TicketPriority.High,
            Status = TicketStatus.Open,
            CategoryId = catDns.Id,
            CustomerId = customer.Id,
            AssignedAgentId = agent.Id,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow.AddHours(-2)
        };

        var initialMsg = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = sampleTicket.Id,
            SenderId = customer.Id,
            Content = sampleTicket.Description,
            IsInternalNote = false,
            IsAiGenerated = false,
            CreatedAtUtc = DateTime.UtcNow.AddHours(-2)
        };

        var agentReply = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = sampleTicket.Id,
            SenderId = agent.Id,
            Content = "Hi Sarah, looking into your DNS propagation right now. The TXT verification challenge appears valid.",
            IsInternalNote = false,
            IsAiGenerated = false,
            CreatedAtUtc = DateTime.UtcNow.AddHours(-1)
        };

        context.Tickets.Add(sampleTicket);
        context.TicketMessages.AddRange(initialMsg, agentReply);

        var kb1 = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Configuring Custom Domains & SSL Termination",
            Slug = "configuring-custom-domains-ssl",
            Category = "Configuration & DNS",
            Content = "To point your custom domain to SupportPilot, create a CNAME record pointing to proxy.supportpilot.io. Automated Let's Encrypt SSL certificates are issued within 15 minutes of DNS propagation.",
            ViewCount = 1240,
            IsPublished = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
        };

        var kb2 = new KnowledgeArticle
        {
            Id = Guid.NewGuid(),
            Title = "Grounded AI Co-Pilot Retrieval Workflows",
            Slug = "grounded-ai-copilot-retrieval",
            Category = "AI & Knowledge Retrieval",
            Content = "SupportPilot embeds indexed documentation into vector embeddings. When drafting ticket replies or answering customer queries, semantic search fetches relevant chunks to ground response suggestions.",
            ViewCount = 890,
            IsPublished = true,
            CreatedAtUtc = DateTime.UtcNow.AddDays(-3)
        };

        context.KnowledgeArticles.AddRange(kb1, kb2);

        await context.SaveChangesAsync();
    }
}
