using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Data;

public static class DbInitializer
{
    public static async Task SeedAsync(AppDbContext context)
    {
        if (context.Database.IsRelational())
        {
            await context.Database.MigrateAsync();
        }
        else
        {
            await context.Database.EnsureCreatedAsync();
        }

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
            Status = TicketStatus.InProgress,
            CategoryId = catDns.Id,
            CustomerId = customer.Id,
            AssignedAgentId = agent.Id,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow.AddHours(-2),
            FirstResponseAtUtc = DateTime.UtcNow.AddHours(-1)
        };
        SlaPolicy.ApplySlaTargets(sampleTicket);

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

        var semanticService = new SemanticSearchService(context);

        var kbArticles = new List<KnowledgeArticle>
        {
            new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = "Configuring Custom Domains & SSL Termination",
                Slug = "configuring-custom-domains-ssl",
                Category = "Configuration & DNS",
                Content = "To point your custom domain to SupportPilot, create a CNAME record with your DNS registrar pointing to proxy.supportpilot.io. Ensure TTL is set under 300s during propagation. Automated Let's Encrypt SSL certificates are issued within 15 minutes of DNS propagation validation. If CAA records exist, ensure letsencrypt.org is permitted.",
                ViewCount = 1420,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-5)
            },
            new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = "Grounded AI Co-Pilot Retrieval Workflows",
                Slug = "grounded-ai-copilot-retrieval",
                Category = "AI & Knowledge Retrieval",
                Content = "SupportPilot embeds indexed documentation into 128-dimensional vector embeddings. When drafting ticket replies or answering customer queries, cosine similarity search retrieves relevant chunks. A minimum confidence threshold (55%) prevents hallucinations; below this threshold, questions escalate to human agents.",
                ViewCount = 980,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-3)
            },
            new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = "Role-Based Access Control and Tenant Isolation",
                Slug = "rbac-and-tenant-isolation",
                Category = "Security & RBAC",
                Content = "SupportPilot supports 4 core roles: Customer, SupportAgent, SupportManager, and SystemAdministrator. Customer accounts are isolated to their own organization's tickets and can never see internal agent notes. Agents operate across assigned team queues within their tenant workspace.",
                ViewCount = 730,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-7)
            },
            new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = "Billing Invoices, VAT Numbers, and Subscription Upgrades",
                Slug = "billing-invoices-vat-numbers",
                Category = "Billing & Subscriptions",
                Content = "Invoices are generated on the 1st of each calendar month. To attach a corporate EU VAT or Tax ID to your receipts, update Organization Settings > Billing > Tax Information. For plan upgrades from Starter to Enterprise, seat licenses update immediately with prorated billing.",
                ViewCount = 610,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-8)
            },
            new KnowledgeArticle
            {
                Id = Guid.NewGuid(),
                Title = "Webhook Subscriptions for Ticket Events and SLA Alerts",
                Slug = "webhook-subscriptions-ticket-events",
                Category = "Developer & API",
                Content = "SupportPilot allows subscribing to webhooks for events like ticket.created, ticket.status_changed, ticket.assigned, and sla.breached. Payloads are delivered via HTTPS POST with an HMAC-SHA256 signature in the X-SupportPilot-Signature header. Failed webhook deliveries retry 3 times with exponential backoff.",
                ViewCount = 520,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-10)
            }
        };

        foreach (var kb in kbArticles)
        {
            var emb = semanticService.GenerateEmbedding($"{kb.Title} {kb.Category} {kb.Content}");
            kb.SetEmbedding(emb);
        }

        context.KnowledgeArticles.AddRange(kbArticles);

        await context.SaveChangesAsync();
    }
}
