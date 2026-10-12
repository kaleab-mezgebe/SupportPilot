namespace SupportPilot.Api.Entities;

public enum UserRole
{
    Customer,
    SupportAgent,
    SupportManager,
    SystemAdministrator
}

public enum TicketPriority
{
    Low,
    Medium,
    High,
    Urgent
}

public enum TicketStatus
{
    Open,
    InProgress,
    PendingCustomer,
    Resolved,
    Closed
}

public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Email { get; set; } = string.Empty;
    public string FullName { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Customer;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAtUtc { get; set; }

    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }
}

public class Organization
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;

    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Ticket> Tickets { get; set; } = new List<Ticket>();
}

public class TicketCategory
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string ColorHex { get; set; } = "#4f46e5";
    public bool IsActive { get; set; } = true;
}

public class Ticket
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string TicketReference { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public TicketPriority Priority { get; set; } = TicketPriority.Medium;
    public TicketStatus Status { get; set; } = TicketStatus.Open;

    public Guid? CategoryId { get; set; }
    public TicketCategory? Category { get; set; }

    public Guid CustomerId { get; set; }
    public User? Customer { get; set; }

    public Guid? AssignedAgentId { get; set; }
    public User? AssignedAgent { get; set; }

    public Guid? OrganizationId { get; set; }
    public Organization? Organization { get; set; }

    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }

    // SLA Tracking (Sprint 5)
    public DateTime? FirstResponseDueAtUtc { get; set; }
    public DateTime? ResolutionDueAtUtc { get; set; }
    public DateTime? FirstResponseAtUtc { get; set; }
    public bool IsSlaBreached { get; set; } = false;

    public ICollection<TicketMessage> Messages { get; set; } = new List<TicketMessage>();
}

public class TicketMessage
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid TicketId { get; set; }
    public Ticket? Ticket { get; set; }

    public Guid SenderId { get; set; }
    public User? Sender { get; set; }

    public string Content { get; set; } = string.Empty;
    public bool IsInternalNote { get; set; } = false;
    public bool IsAiGenerated { get; set; } = false;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
}

public class KnowledgeArticle
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public string Title { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public string Category { get; set; } = string.Empty;
    public bool IsPublished { get; set; } = true;
    public int ViewCount { get; set; } = 0;
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}

public class AuditLog
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid? UserId { get; set; }
    public string Action { get; set; } = string.Empty;
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Details { get; set; } = string.Empty;
    public string IpAddress { get; set; } = string.Empty;
    public DateTime TimestampUtc { get; set; } = DateTime.UtcNow;
}
