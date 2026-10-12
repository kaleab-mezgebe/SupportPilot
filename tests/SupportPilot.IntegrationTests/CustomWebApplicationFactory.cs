using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using SupportPilot.Api.Data;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>
{
    private readonly string _databaseName = $"SupportPilot_TestDb_{Guid.NewGuid()}";

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove existing AppDbContext descriptor
            var descriptor = services.SingleOrDefault(d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor != null)
            {
                services.Remove(descriptor);
            }

            // Register in-memory database for integration tests
            services.AddDbContext<AppDbContext>(options =>
            {
                options.UseInMemoryDatabase(_databaseName);
            });

            // Build service provider and seed testing data
            var sp = services.BuildServiceProvider();
            using var scope = sp.CreateScope();
            var scopedServices = scope.ServiceProvider;
            var db = scopedServices.GetRequiredService<AppDbContext>();
            var logger = scopedServices.GetRequiredService<ILogger<CustomWebApplicationFactory>>();

            try
            {
                db.Database.EnsureCreated();
                SeedIntegrationTestData(db);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "An error occurred seeding the test database.");
            }
        });
    }

    private static void SeedIntegrationTestData(AppDbContext db)
    {
        if (db.Users.Any())
        {
            return;
        }

        var passwordHasher = new PasswordHasher();
        var defaultHash = passwordHasher.HashPassword("Password123!");

        var org = new Organization
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = "Acme Corp Testing",
            Slug = "acme-corp-testing",
            CreatedAtUtc = DateTime.UtcNow
        };
        db.Organizations.Add(org);

        var admin = new User
        {
            Id = Guid.Parse("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"),
            Email = "admin@acme.test",
            FullName = "Admin Test User",
            PasswordHash = defaultHash,
            Role = UserRole.SystemAdministrator,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        var agent = new User
        {
            Id = Guid.Parse("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"),
            Email = "agent@acme.test",
            FullName = "Agent Test User",
            PasswordHash = defaultHash,
            Role = UserRole.SupportAgent,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        var customer = new User
        {
            Id = Guid.Parse("cccccccc-cccc-cccc-cccc-cccccccccccc"),
            Email = "customer@acme.test",
            FullName = "Customer Test User",
            PasswordHash = defaultHash,
            Role = UserRole.Customer,
            OrganizationId = org.Id,
            CreatedAtUtc = DateTime.UtcNow
        };

        db.Users.AddRange(admin, agent, customer);

        var category = new TicketCategory
        {
            Id = Guid.Parse("dddddddd-dddd-dddd-dddd-dddddddddddd"),
            Name = "Billing & Subscriptions"
        };
        db.TicketCategories.Add(category);

        var article = new KnowledgeArticle
        {
            Id = Guid.Parse("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"),
            Title = "Refund and Billing Policy",
            Content = "All refunds requested within 14 days of purchase will be credited back to your original payment method within 3 business days.",
            Category = "Billing",
            CreatedAtUtc = DateTime.UtcNow
        };
        db.KnowledgeArticles.Add(article);

        var ticket = new Ticket
        {
            Id = Guid.Parse("ffffffff-ffff-ffff-ffff-ffffffffffff"),
            TicketReference = "TCK-TEST-001",
            Title = "Need help with invoice",
            Description = "My invoice is showing an incorrect charge for the current billing cycle.",
            Status = TicketStatus.Open,
            Priority = TicketPriority.Medium,
            CustomerId = customer.Id,
            AssignedAgentId = agent.Id,
            OrganizationId = org.Id,
            CategoryId = category.Id,
            CreatedAtUtc = DateTime.UtcNow,
            FirstResponseDueAtUtc = DateTime.UtcNow.AddHours(8),
            ResolutionDueAtUtc = DateTime.UtcNow.AddHours(24)
        };
        db.Tickets.Add(ticket);

        db.SaveChanges();
    }
}
