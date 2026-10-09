using SupportPilot.Api.Entities;

namespace SupportPilot.Api.DTOs;

public record HealthStatusDto(
    string Status,
    string ServiceName,
    string Version,
    string Environment,
    DateTime TimestampUtc
);

public record DashboardStatsDto(
    int TotalTickets,
    int OpenTickets,
    int InProgressTickets,
    int ResolvedTickets,
    int AvgResponseTimeMinutes,
    int CustomerSatisfactionRate,
    List<TicketDto> RecentTickets
);

public record TicketDto(
    Guid Id,
    string TicketReference,
    string Title,
    string Description,
    string Priority,
    string Status,
    string? CategoryName,
    string CustomerName,
    string CustomerEmail,
    string? AssignedAgentName,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    int MessageCount
);

public record CreateTicketRequest(
    string Title,
    string Description,
    TicketPriority Priority,
    string CustomerName,
    string CustomerEmail,
    string? CategoryName
);

public record AddTicketMessageRequest(
    string Content,
    string SenderName,
    bool IsInternalNote,
    bool IsAiGenerated
);
