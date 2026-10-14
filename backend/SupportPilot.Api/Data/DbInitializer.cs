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

        var passwordHasher = new PasswordHasher();
        var defaultPasswordHash = passwordHasher.HashPassword("Password123!");

        // Ensure Organization
        var org = await context.Organizations.FirstOrDefaultAsync();
        if (org == null)
        {
            org = new Organization
            {
                Id = Guid.NewGuid(),
                Name = "SupportPilot HQ",
                Slug = "supportpilot-hq",
                CreatedAtUtc = DateTime.UtcNow
            };
            context.Organizations.Add(org);
            await context.SaveChangesAsync();
        }

        // Seed Users
        var usersToSeed = new List<User>
        {
            new() { Id = Guid.NewGuid(), Email = "admin@supportpilot.io", FullName = "System Administrator", PasswordHash = defaultPasswordHash, Role = UserRole.SystemAdministrator, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-30) },
            new() { Id = Guid.NewGuid(), Email = "alex.rivera@supportpilot.io", FullName = "Alex Rivera", PasswordHash = defaultPasswordHash, Role = UserRole.SupportAgent, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-25) },
            new() { Id = Guid.NewGuid(), Email = "emma.watson@supportpilot.io", FullName = "Emma Watson", PasswordHash = defaultPasswordHash, Role = UserRole.SupportAgent, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-20) },
            new() { Id = Guid.NewGuid(), Email = "sarah@cyberdyne.io", FullName = "Sarah Connor", PasswordHash = defaultPasswordHash, Role = UserRole.Customer, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-15) },
            new() { Id = Guid.NewGuid(), Email = "marcus@helios.tech", FullName = "Marcus Vance", PasswordHash = defaultPasswordHash, Role = UserRole.Customer, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-14) },
            new() { Id = Guid.NewGuid(), Email = "claire@umbrella-corp.com", FullName = "Claire Redfield", PasswordHash = defaultPasswordHash, Role = UserRole.Customer, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-10) },
            new() { Id = Guid.NewGuid(), Email = "david@neuroflow.ai", FullName = "David Chen", PasswordHash = defaultPasswordHash, Role = UserRole.Customer, OrganizationId = org.Id, CreatedAtUtc = DateTime.UtcNow.AddDays(-8) }
        };

        foreach (var u in usersToSeed)
        {
            var existing = await context.Users.FirstOrDefaultAsync(e => e.Email == u.Email);
            if (existing == null)
            {
                context.Users.Add(u);
            }
            else if (existing.PasswordHash == "hashed_pw")
            {
                existing.PasswordHash = defaultPasswordHash;
            }
        }
        await context.SaveChangesAsync();

        var admin = await context.Users.FirstAsync(u => u.Email == "admin@supportpilot.io");
        var agentAlex = await context.Users.FirstAsync(u => u.Email == "alex.rivera@supportpilot.io");
        var agentEmma = await context.Users.FirstAsync(u => u.Email == "emma.watson@supportpilot.io");
        var customerSarah = await context.Users.FirstAsync(u => u.Email == "sarah@cyberdyne.io");
        var customerMarcus = await context.Users.FirstAsync(u => u.Email == "marcus@helios.tech");
        var customerClaire = await context.Users.FirstAsync(u => u.Email == "claire@umbrella-corp.com");
        var customerDavid = await context.Users.FirstAsync(u => u.Email == "david@neuroflow.ai");

        // Seed Categories
        var categoriesToSeed = new List<TicketCategory>
        {
            new() { Id = Guid.NewGuid(), Name = "Configuration & DNS", Description = "Custom domain, CNAME, SSL validation issues", ColorHex = "#6366f1", IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "Billing & Subscriptions", Description = "Invoices, VAT numbers, plan upgrades", ColorHex = "#06b6d4", IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "AI & Knowledge Retrieval", Description = "RAG queries, documentation embeddings, fallback sync", ColorHex = "#8b5cf6", IsActive = true },
            new() { Id = Guid.NewGuid(), Name = "Account & RBAC", Description = "Permissions, SSO, security roles, multi-tenant workspace", ColorHex = "#10b981", IsActive = true }
        };

        foreach (var cat in categoriesToSeed)
        {
            if (!await context.TicketCategories.AnyAsync(c => c.Name == cat.Name))
            {
                context.TicketCategories.Add(cat);
            }
        }
        await context.SaveChangesAsync();

        var catDns = await context.TicketCategories.FirstAsync(c => c.Name == "Configuration & DNS");
        var catBilling = await context.TicketCategories.FirstAsync(c => c.Name == "Billing & Subscriptions");
        var catAi = await context.TicketCategories.FirstAsync(c => c.Name == "AI & Knowledge Retrieval");
        var catAccount = await context.TicketCategories.FirstAsync(c => c.Name == "Account & RBAC");

        // Seed Knowledge Articles with Real Embeddings
        var semanticService = new SemanticSearchService(context);
        var kbArticles = new List<KnowledgeArticle>
        {
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Configuring Custom Domains & SSL Termination",
                Slug = "configuring-custom-domains-ssl",
                Category = "Configuration & DNS",
                Content = "To point your custom domain to SupportPilot, create a CNAME record with your DNS registrar pointing to proxy.supportpilot.io. Ensure TTL is set under 300s during propagation. Automated Let's Encrypt SSL certificates are issued within 15 minutes of DNS propagation validation. If CAA records exist, ensure letsencrypt.org is permitted.",
                ViewCount = 1420,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-15)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Grounded AI Co-Pilot Retrieval Workflows",
                Slug = "grounded-ai-copilot-retrieval",
                Category = "AI & Knowledge Retrieval",
                Content = "SupportPilot embeds indexed documentation into 128-dimensional vector embeddings. When drafting ticket replies or answering customer queries, cosine similarity search retrieves relevant chunks. A minimum confidence threshold (55%) prevents hallucinations; below this threshold, questions escalate to human agents.",
                ViewCount = 980,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-12)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Role-Based Access Control and Tenant Isolation",
                Slug = "rbac-and-tenant-isolation",
                Category = "Account & RBAC",
                Content = "SupportPilot supports 4 core roles: Customer, SupportAgent, SupportManager, and SystemAdministrator. Customer accounts are isolated to their own organization's tickets and can never see internal agent notes. Agents operate across assigned team queues within their tenant workspace.",
                ViewCount = 730,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-10)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Billing Invoices, VAT Numbers, and Subscription Upgrades",
                Slug = "billing-invoices-vat-numbers",
                Category = "Billing & Subscriptions",
                Content = "Invoices are generated on the 1st of each calendar month. To attach a corporate EU VAT or Tax ID to your receipts, update Organization Settings > Billing > Tax Information. For plan upgrades from Starter to Enterprise, seat licenses update immediately with prorated billing.",
                ViewCount = 610,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-9)
            },
            new()
            {
                Id = Guid.NewGuid(),
                Title = "Webhook Subscriptions for Ticket Events and SLA Alerts",
                Slug = "webhook-subscriptions-ticket-events",
                Category = "Configuration & DNS",
                Content = "SupportPilot allows subscribing to webhooks for events like ticket.created, ticket.status_changed, ticket.assigned, and sla.breached. Payloads are delivered via HTTPS POST with an HMAC-SHA256 signature in the X-SupportPilot-Signature header. Failed webhook deliveries retry 3 times with exponential backoff.",
                ViewCount = 520,
                IsPublished = true,
                CreatedAtUtc = DateTime.UtcNow.AddDays(-7)
            }
        };

        foreach (var kb in kbArticles)
        {
            if (!await context.KnowledgeArticles.AnyAsync(a => a.Title == kb.Title))
            {
                var emb = semanticService.GenerateEmbedding($"{kb.Title} {kb.Category} {kb.Content}");
                kb.SetEmbedding(emb);
                context.KnowledgeArticles.Add(kb);
            }
        }
        await context.SaveChangesAsync();

        // Seed Real Tickets, Messages, CSAT, and Audit Logs
        if (!await context.Tickets.AnyAsync(t => t.TicketReference == "SP-1043"))
        {
            var now = DateTime.UtcNow;

            // 1. SP-1043: Urgent Open
            var t1 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1043",
                Title = "Payment gateway webhooks returning 500 error in checkout",
                Description = "Customers are reporting charged credit cards but order confirmation states failed checkout. Webhook logs show gateway error 500.",
                Priority = TicketPriority.Urgent,
                Status = TicketStatus.Open,
                CategoryId = catBilling.Id,
                CustomerId = customerClaire.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddMinutes(-35),
                FirstResponseDueAtUtc = now.AddMinutes(25),
                ResolutionDueAtUtc = now.AddHours(3)
            };

            var t1Msg = new TicketMessage
            {
                Id = Guid.NewGuid(),
                TicketId = t1.Id,
                SenderId = customerClaire.Id,
                Content = t1.Description,
                IsInternalNote = false,
                IsAiGenerated = false,
                CreatedAtUtc = now.AddMinutes(-35)
            };

            // 2. SP-1042: High InProgress
            var t2 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1042",
                Title = "Unable to connect custom domain to workspace",
                Description = "I followed DNS CNAME setup for support.mycompany.io but certificate validation timed out after 30 minutes.",
                Priority = TicketPriority.High,
                Status = TicketStatus.InProgress,
                CategoryId = catDns.Id,
                CustomerId = customerSarah.Id,
                AssignedAgentId = agentAlex.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddHours(-2),
                FirstResponseAtUtc = now.AddMinutes(-15),
                FirstResponseDueAtUtc = now.AddHours(2),
                ResolutionDueAtUtc = now.AddHours(10)
            };

            var t2Msg1 = new TicketMessage
            {
                Id = Guid.NewGuid(),
                TicketId = t2.Id,
                SenderId = customerSarah.Id,
                Content = t2.Description,
                IsInternalNote = false,
                IsAiGenerated = false,
                CreatedAtUtc = now.AddHours(-2)
            };

            var t2Msg2 = new TicketMessage
            {
                Id = Guid.NewGuid(),
                TicketId = t2.Id,
                SenderId = agentAlex.Id,
                Content = "Hi Sarah, investigating your CNAME propagation. It looks like your DNS registrar had a caching TTL of 3600s. I am forcing a re-poll with Let's Encrypt right now.",
                IsInternalNote = false,
                IsAiGenerated = false,
                CreatedAtUtc = now.AddMinutes(-15)
            };

            var t2Msg3 = new TicketMessage
            {
                Id = Guid.NewGuid(),
                TicketId = t2.Id,
                SenderId = agentAlex.Id,
                Content = "Internal Note: Edge router certificate challenge returned 200 OK. Waiting for DNS cache clearance.",
                IsInternalNote = true,
                IsAiGenerated = false,
                CreatedAtUtc = now.AddMinutes(-10)
            };

            // 3. SP-1041: Medium Resolved
            var t3 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1041",
                Title = "Billing inquiry: invoice receipt VAT id missing",
                Description = "Need updated invoice with EU VAT ID for Q3 accounting period.",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Resolved,
                CategoryId = catBilling.Id,
                CustomerId = customerMarcus.Id,
                AssignedAgentId = agentEmma.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddHours(-6),
                FirstResponseAtUtc = now.AddHours(-5),
                ResolvedAtUtc = now.AddHours(-1),
                FirstResponseDueAtUtc = now.AddHours(2),
                ResolutionDueAtUtc = now.AddHours(18)
            };

            var t3Msg1 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t3.Id, SenderId = customerMarcus.Id, Content = t3.Description, CreatedAtUtc = now.AddHours(-6) };
            var t3Msg2 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t3.Id, SenderId = agentEmma.Id, Content = "Hello Marcus, I have regenerated your Q3 receipt including EU VAT ID NL84920482B01. Attached to your portal.", CreatedAtUtc = now.AddHours(-1) };

            var t3Csat = new CsatSurvey
            {
                Id = Guid.NewGuid(),
                TicketId = t3.Id,
                CustomerId = customerMarcus.Id,
                Rating = 5,
                FeedbackComment = "Got our VAT invoice regenerated with zero friction. Very impressed with the portal.",
                SubmittedAtUtc = now.AddMinutes(-40)
            };

            // 4. SP-1040: Urgent Open
            var t4 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1040",
                Title = "AI Knowledge Base sync fails on large markdown docs",
                Description = "When syncing 500+ kb documentation, the vector ingestion job returns timeout 504.",
                Priority = TicketPriority.Urgent,
                Status = TicketStatus.Open,
                CategoryId = catAi.Id,
                CustomerId = customerDavid.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddHours(-12),
                FirstResponseDueAtUtc = now.AddHours(1),
                ResolutionDueAtUtc = now.AddHours(4)
            };

            var t4Msg = new TicketMessage { Id = Guid.NewGuid(), TicketId = t4.Id, SenderId = customerDavid.Id, Content = t4.Description, CreatedAtUtc = now.AddHours(-12) };

            // 5. SP-1039: Low Resolved
            var t5 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1039",
                Title = "How to export ticket history to CSV?",
                Description = "Looking for an automated way to export weekly resolved tickets for reporting.",
                Priority = TicketPriority.Low,
                Status = TicketStatus.Resolved,
                CategoryId = catAccount.Id,
                CustomerId = customerSarah.Id,
                AssignedAgentId = agentAlex.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddDays(-1),
                FirstResponseAtUtc = now.AddDays(-1).AddMinutes(20),
                ResolvedAtUtc = now.AddHours(-3),
                FirstResponseDueAtUtc = now.AddHours(8),
                ResolutionDueAtUtc = now.AddHours(48)
            };

            var t5Msg1 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t5.Id, SenderId = customerSarah.Id, Content = t5.Description, CreatedAtUtc = now.AddDays(-1) };
            var t5Msg2 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t5.Id, SenderId = agentAlex.Id, Content = "Hi Sarah! You can export your full ticket log anytime via Settings > Data Export > Export CSV.", CreatedAtUtc = now.AddHours(-3) };

            var t5Csat = new CsatSurvey
            {
                Id = Guid.NewGuid(),
                TicketId = t5.Id,
                CustomerId = customerSarah.Id,
                Rating = 5,
                FeedbackComment = "Alex Rivera resolved our inquiry in under 20 minutes! Fantastic support.",
                SubmittedAtUtc = now.AddHours(-2)
            };

            // 6. SP-1038: Medium Resolved
            var t6 = new Ticket
            {
                Id = Guid.NewGuid(),
                TicketReference = "SP-1038",
                Title = "Webhook signature verification failing in Python SDK",
                Description = "HMAC signature mismatch when verifying X-SupportPilot-Signature header.",
                Priority = TicketPriority.Medium,
                Status = TicketStatus.Resolved,
                CategoryId = catDns.Id,
                CustomerId = customerMarcus.Id,
                AssignedAgentId = agentEmma.Id,
                OrganizationId = org.Id,
                CreatedAtUtc = now.AddDays(-2),
                FirstResponseAtUtc = now.AddDays(-2).AddMinutes(15),
                ResolvedAtUtc = now.AddDays(-1),
                FirstResponseDueAtUtc = now.AddHours(2),
                ResolutionDueAtUtc = now.AddHours(18)
            };

            var t6Msg1 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t6.Id, SenderId = customerMarcus.Id, Content = t6.Description, CreatedAtUtc = now.AddDays(-2) };
            var t6Msg2 = new TicketMessage { Id = Guid.NewGuid(), TicketId = t6.Id, SenderId = agentEmma.Id, Content = "Be sure to read raw request bytes before decoding JSON in Flask/FastAPI to preserve canonical byte order.", CreatedAtUtc = now.AddDays(-1) };

            var t6Csat = new CsatSurvey
            {
                Id = Guid.NewGuid(),
                TicketId = t6.Id,
                CustomerId = customerMarcus.Id,
                Rating = 4,
                FeedbackComment = "Clear explanation of the HMAC secret generation.",
                SubmittedAtUtc = now.AddDays(-1).AddHours(1)
            };

            context.Tickets.AddRange(t1, t2, t3, t4, t5, t6);
            context.TicketMessages.AddRange(t1Msg, t2Msg1, t2Msg2, t2Msg3, t3Msg1, t3Msg2, t4Msg, t5Msg1, t5Msg2, t6Msg1, t6Msg2);
            context.CsatSurveys.AddRange(t3Csat, t5Csat, t6Csat);

            // Seed Real Audit Logs
            var auditLogs = new List<AuditLog>
            {
                new() { Id = Guid.NewGuid(), UserId = agentAlex.Id, Action = "Ticket SP-1042 status updated to InProgress", EntityName = "Ticket", EntityId = t2.Id.ToString(), Details = "Agent assigned and started investigation", TimestampUtc = now.AddMinutes(-15) },
                new() { Id = Guid.NewGuid(), UserId = agentEmma.Id, Action = "Ticket SP-1041 marked Resolved", EntityName = "Ticket", EntityId = t3.Id.ToString(), Details = "Regenerated invoice provided to customer", TimestampUtc = now.AddHours(-1) },
                new() { Id = Guid.NewGuid(), UserId = customerMarcus.Id, Action = "CSAT rating 5/5 submitted for Ticket SP-1041", EntityName = "CsatSurvey", EntityId = t3Csat.Id.ToString(), Details = "Positive feedback received", TimestampUtc = now.AddMinutes(-40) },
                new() { Id = Guid.NewGuid(), UserId = agentAlex.Id, Action = "Ticket SP-1039 marked Resolved", EntityName = "Ticket", EntityId = t5.Id.ToString(), Details = "CSV export instructions sent", TimestampUtc = now.AddHours(-3) },
                new() { Id = Guid.NewGuid(), UserId = customerSarah.Id, Action = "CSAT rating 5/5 submitted for Ticket SP-1039", EntityName = "CsatSurvey", EntityId = t5Csat.Id.ToString(), Details = "5-star rating recorded", TimestampUtc = now.AddHours(-2) },
                new() { Id = Guid.NewGuid(), UserId = admin.Id, Action = "Vector embeddings indexed for 5 Knowledge Base articles", EntityName = "KnowledgeArticle", EntityId = "batch", Details = "Dense vector index rebuilt", TimestampUtc = now.AddDays(-3) }
            };

            context.AuditLogs.AddRange(auditLogs);
            await context.SaveChangesAsync();
        }
    }
}
