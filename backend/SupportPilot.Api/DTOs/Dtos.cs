using SupportPilot.Api.Entities;

namespace SupportPilot.Api.DTOs;

// --- Auth DTOs ---
public record RegisterRequest(
    string FullName,
    string Email,
    string Password,
    UserRole Role = UserRole.Customer,
    string? OrganizationName = null
);

public record LoginRequest(
    string Email,
    string Password
);

public record AuthResponseDto(
    string Token,
    UserDto User
);

public record UserDto(
    Guid Id,
    string Email,
    string FullName,
    string Role,
    Guid? OrganizationId,
    string? OrganizationName,
    DateTime CreatedAtUtc
);

// --- Health & Dashboard DTOs ---
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

// --- Ticket DTOs ---
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
    int MessageCount,
    DateTime? FirstResponseDueAtUtc = null,
    DateTime? ResolutionDueAtUtc = null,
    DateTime? FirstResponseAtUtc = null,
    bool IsSlaBreached = false
);

public record TicketDetailDto(
    Guid Id,
    string TicketReference,
    string Title,
    string Description,
    string Priority,
    string Status,
    Guid? CategoryId,
    string? CategoryName,
    Guid CustomerId,
    string CustomerName,
    string CustomerEmail,
    Guid? AssignedAgentId,
    string? AssignedAgentName,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc,
    DateTime? ResolvedAtUtc,
    List<TicketMessageDto> Messages,
    DateTime? FirstResponseDueAtUtc = null,
    DateTime? ResolutionDueAtUtc = null,
    DateTime? FirstResponseAtUtc = null,
    bool IsSlaBreached = false
);

public record TicketMessageDto(
    Guid Id,
    Guid TicketId,
    Guid SenderId,
    string SenderName,
    string SenderRole,
    string Content,
    bool IsInternalNote,
    bool IsAiGenerated,
    DateTime CreatedAtUtc
);

public record CreateTicketRequest(
    string Title,
    string Description,
    TicketPriority Priority,
    string? CategoryName,
    string? CustomerName = null,
    string? CustomerEmail = null
);

public record AddTicketMessageRequest(
    string Content,
    bool IsInternalNote = false,
    bool IsAiGenerated = false
);

public record UpdateTicketStatusRequest(
    TicketStatus Status
);

public record UpdateTicketPriorityRequest(
    TicketPriority Priority
);

public record AssignTicketRequest(
    Guid? AgentId
);

// --- Bulk Triage DTOs (Sprint 5) ---
public record BulkUpdateStatusRequest(
    List<Guid> TicketIds,
    TicketStatus Status
);

public record BulkAssignRequest(
    List<Guid> TicketIds,
    Guid? AgentId
);

public record BulkUpdatePriorityRequest(
    List<Guid> TicketIds,
    TicketPriority Priority
);

public record BulkOperationResultDto(
    int UpdatedCount,
    List<Guid> AffectedTicketIds,
    string Message
);

public record PagedResultDto<T>(
    List<T> Items,
    int TotalCount,
    int Page,
    int PageSize,
    int TotalPages
);

// --- Knowledge Base DTOs ---
public record KnowledgeArticleDto(
    Guid Id,
    string Title,
    string Slug,
    string Content,
    string Category,
    bool IsPublished,
    int ViewCount,
    DateTime CreatedAtUtc,
    DateTime? UpdatedAtUtc
);

public record CreateKnowledgeArticleRequest(
    string Title,
    string Content,
    string Category,
    bool IsPublished = true
);

// --- Sprint 6: RAG & Semantic Search DTOs ---
public record RagQueryRequest(
    string Query,
    double ConfidenceThreshold = 0.55
);

public record RagCitationDto(
    Guid ArticleId,
    string Title,
    string Slug,
    string Category,
    double RelevanceScore,
    string Excerpt
);

public record RagAnswerDto(
    string Query,
    string Answer,
    double ConfidenceScore,
    bool IsGrounded,
    List<RagCitationDto> Citations,
    string? EscalationReason
);

public record SemanticSearchArticleDto(
    Guid Id,
    string Title,
    string Slug,
    string Category,
    string Excerpt,
    double RelevanceScore
);

public record CopilotSuggestionDto(
    Guid TicketId,
    string SuggestedResponse,
    string SourceArticleTitle,
    double ConfidenceScore,
    List<string> Citations
);

// --- Sprint 9: Post-MVP Enhancements ---
// CSAT Surveys
public record SubmitCsatRequest(
    int Rating,
    string? FeedbackComment = null
);

public record CsatSurveyDto(
    Guid Id,
    Guid TicketId,
    string TicketReference,
    Guid CustomerId,
    string CustomerName,
    int Rating,
    string? FeedbackComment,
    DateTime SubmittedAtUtc
);

public record CsatMetricsDto(
    double AverageRating,
    int TotalResponses,
    double SatisfactionPercentage,
    Dictionary<string, int> RatingDistribution,
    List<CsatSurveyDto> RecentFeedback
);

// Inbound Email Webhook
public record InboundEmailWebhookDto(
    string From,
    string To,
    string Subject,
    string BodyText,
    string? BodyHtml = null,
    string? MessageId = null
);

public record InboundEmailResultDto(
    bool Success,
    string Action,
    string TicketReference,
    Guid TicketId,
    string Message
);

// Multi-Channel Slack & Teams
public record SlackWebhookTestRequest(
    string WebhookUrl,
    string? Message = null
);

public record IntegrationStatusDto(
    bool SlackConfigured,
    bool EmailInboundActive,
    string ActiveLlmProvider,
    DateTime TimestampUtc
);
