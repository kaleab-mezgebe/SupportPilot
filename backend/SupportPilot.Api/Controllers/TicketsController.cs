using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TicketsController : ControllerBase
{
    private readonly AppDbContext _dbContext;

    public TicketsController(AppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    private (Guid? UserId, UserRole? Role, Guid? OrgId) GetCurrentUserContext()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? User.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
        var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value;
        var orgClaim = User.FindFirst("organization_id")?.Value;

        Guid? userId = Guid.TryParse(userIdClaim, out var uid) ? uid : null;
        UserRole? role = Enum.TryParse<UserRole>(roleClaim, true, out var r) ? r : null;
        Guid? orgId = Guid.TryParse(orgClaim, out var oid) ? oid : null;

        return (userId, role, orgId);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetTickets(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? search,
        [FromQuery] string? queue,
        [FromQuery] string? sortBy,
        [FromQuery] Guid? agentId,
        [FromQuery] Guid? customerId)
    {
        var (currentUserId, currentRole, currentOrgId) = GetCurrentUserContext();

        var query = _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .AsNoTracking()
            .AsQueryable();

        // 1. Multi-Tenancy & Role-based scoping
        if (currentRole == UserRole.Customer && currentUserId.HasValue)
        {
            query = query.Where(t => t.CustomerId == currentUserId.Value);
        }
        else if (currentOrgId.HasValue)
        {
            query = query.Where(t => t.OrganizationId == currentOrgId.Value || t.OrganizationId == null);
        }

        // 2. Queue Presets (Sprint 5)
        var now = DateTime.UtcNow;
        if (!string.IsNullOrWhiteSpace(queue))
        {
            switch (queue.ToLowerInvariant())
            {
                case "assigned_to_me":
                    if (currentUserId.HasValue)
                    {
                        query = query.Where(t => t.AssignedAgentId == currentUserId.Value);
                    }
                    break;
                case "unassigned":
                    query = query.Where(t => t.AssignedAgentId == null && t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed);
                    break;
                case "sla_at_risk":
                    // Due in < 2 hours or already breached
                    var riskHorizon = now.AddHours(2);
                    query = query.Where(t => t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed &&
                        (t.IsSlaBreached || 
                         (t.ResolutionDueAtUtc != null && t.ResolutionDueAtUtc <= riskHorizon) ||
                         (t.FirstResponseAtUtc == null && t.FirstResponseDueAtUtc != null && t.FirstResponseDueAtUtc <= riskHorizon)));
                    break;
                case "urgent":
                    query = query.Where(t => t.Priority == TicketPriority.Urgent && t.Status != TicketStatus.Resolved && t.Status != TicketStatus.Closed);
                    break;
                case "resolved":
                    query = query.Where(t => t.Status == TicketStatus.Resolved || t.Status == TicketStatus.Closed);
                    break;
            }
        }

        // 3. Status Filter
        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            if (Enum.TryParse<TicketStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

        // 4. Priority Filter
        if (!string.IsNullOrWhiteSpace(priority) && priority != "All")
        {
            if (Enum.TryParse<TicketPriority>(priority, true, out var parsedPriority))
            {
                query = query.Where(t => t.Priority == parsedPriority);
            }
        }

        if (agentId.HasValue)
        {
            query = query.Where(t => t.AssignedAgentId == agentId.Value);
        }

        if (customerId.HasValue && currentRole != UserRole.Customer)
        {
            query = query.Where(t => t.CustomerId == customerId.Value);
        }

        // 5. Search
        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(t =>
                t.Title.ToLower().Contains(searchLower) ||
                t.TicketReference.ToLower().Contains(searchLower) ||
                (t.Customer != null && t.Customer.FullName.ToLower().Contains(searchLower)) ||
                (t.Customer != null && t.Customer.Email.ToLower().Contains(searchLower)));
        }

        // 6. Sorting
        query = (sortBy?.ToLowerInvariant()) switch
        {
            "oldest" => query.OrderBy(t => t.CreatedAtUtc),
            "sla_deadline" => query.OrderBy(t => t.ResolutionDueAtUtc ?? DateTime.MaxValue),
            "priority" => query.OrderByDescending(t => t.Priority).ThenByDescending(t => t.CreatedAtUtc),
            _ => query.OrderByDescending(t => t.CreatedAtUtc)
        };

        var ticketEntities = await query.ToListAsync();
        var dtos = ticketEntities.Select(MapToDto).ToList();

        return Ok(dtos);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDetailDto>> GetById(Guid id)
    {
        var (currentUserId, currentRole, currentOrgId) = GetCurrentUserContext();

        var ticket = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
                .ThenInclude(m => m.Sender)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        // Customer tenant isolation guard: customers can ONLY see their own tickets
        if (currentRole == UserRole.Customer && currentUserId.HasValue && ticket.CustomerId != currentUserId.Value)
        {
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "You do not have permission to view this ticket." });
        }

        // Filter out internal notes for customers
        var messages = ticket.Messages
            .Where(m => currentRole != UserRole.Customer || !m.IsInternalNote)
            .OrderBy(m => m.CreatedAtUtc)
            .Select(m => new TicketMessageDto(
                m.Id,
                m.TicketId,
                m.SenderId,
                m.Sender?.FullName ?? "Support Team",
                m.Sender?.Role.ToString() ?? "SupportAgent",
                m.Content,
                m.IsInternalNote,
                m.IsAiGenerated,
                m.CreatedAtUtc
            ))
            .ToList();

        var isBreached = SlaPolicy.EvaluateBreach(ticket, DateTime.UtcNow);

        var detailDto = new TicketDetailDto(
            ticket.Id,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.Priority.ToString(),
            ticket.Status.ToString(),
            ticket.CategoryId,
            ticket.Category?.Name,
            ticket.CustomerId,
            ticket.Customer?.FullName ?? "Anonymous Customer",
            ticket.Customer?.Email ?? "customer@unknown.io",
            ticket.AssignedAgentId,
            ticket.AssignedAgent?.FullName,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc,
            ticket.ResolvedAtUtc,
            messages,
            ticket.FirstResponseDueAtUtc,
            ticket.ResolutionDueAtUtc,
            ticket.FirstResponseAtUtc,
            isBreached
        );

        return Ok(detailDto);
    }

    [HttpPost]
    public async Task<ActionResult<TicketDto>> CreateTicket([FromBody] CreateTicketRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { message = "Title and description are required." });
        }

        var (currentUserId, _, currentOrgId) = GetCurrentUserContext();

        // Determine Customer
        User? customer = null;
        if (currentUserId.HasValue)
        {
            customer = await _dbContext.Users.FindAsync(currentUserId.Value);
        }

        if (customer == null && !string.IsNullOrWhiteSpace(request.CustomerEmail))
        {
            var email = request.CustomerEmail.Trim().ToLowerInvariant();
            customer = await _dbContext.Users.FirstOrDefaultAsync(u => u.Email.ToLower() == email);
            if (customer == null)
            {
                customer = new User
                {
                    Id = Guid.NewGuid(),
                    Email = email,
                    FullName = string.IsNullOrWhiteSpace(request.CustomerName) ? email.Split('@')[0] : request.CustomerName.Trim(),
                    PasswordHash = "guest_account",
                    Role = UserRole.Customer,
                    OrganizationId = currentOrgId,
                    CreatedAtUtc = DateTime.UtcNow
                };
                _dbContext.Users.Add(customer);
            }
        }

        if (customer == null)
        {
            customer = await _dbContext.Users.FirstOrDefaultAsync(u => u.Role == UserRole.Customer)
                       ?? await _dbContext.Users.FirstOrDefaultAsync();
        }

        if (customer == null)
        {
            customer = new User
            {
                Id = Guid.NewGuid(),
                Email = "guest@supportpilot.io",
                FullName = "Guest Customer",
                Role = UserRole.Customer,
                CreatedAtUtc = DateTime.UtcNow
            };
            _dbContext.Users.Add(customer);
        }

        // Determine category
        TicketCategory? category = null;
        if (!string.IsNullOrWhiteSpace(request.CategoryName))
        {
            category = await _dbContext.TicketCategories.FirstOrDefaultAsync(c => c.Name == request.CategoryName);
        }

        var ticketCount = await _dbContext.Tickets.CountAsync();
        var reference = $"SP-{1040 + ticketCount + 1}";

        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            TicketReference = reference,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Priority = request.Priority,
            Status = TicketStatus.Open,
            CategoryId = category?.Id,
            CustomerId = customer.Id,
            OrganizationId = customer.OrganizationId ?? currentOrgId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Apply SLA deadlines based on Priority
        SlaPolicy.ApplySlaTargets(ticket);

        // Initial customer message
        var initialMessage = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = customer.Id,
            Content = ticket.Description,
            IsInternalNote = false,
            IsAiGenerated = false,
            CreatedAtUtc = DateTime.UtcNow
        };

        _dbContext.Tickets.Add(ticket);
        _dbContext.TicketMessages.Add(initialMessage);
        await _dbContext.SaveChangesAsync();

        var resultDto = MapToDto(ticket);
        return CreatedAtAction(nameof(GetById), new { id = ticket.Id }, resultDto);
    }

    [HttpPost("{id:guid}/messages")]
    public async Task<ActionResult<TicketMessageDto>> AddMessage(Guid id, [FromBody] AddTicketMessageRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Content))
        {
            return BadRequest(new { message = "Message content cannot be empty." });
        }

        var ticket = await _dbContext.Tickets.FindAsync(id);
        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var (currentUserId, currentRole, _) = GetCurrentUserContext();

        User? sender = null;
        if (currentUserId.HasValue)
        {
            sender = await _dbContext.Users.FindAsync(currentUserId.Value);
        }

        if (sender == null)
        {
            if (request.IsInternalNote)
            {
                sender = await _dbContext.Users.FirstOrDefaultAsync(u => u.Role == UserRole.SupportAgent || u.Role == UserRole.SupportManager);
            }
            else
            {
                sender = await _dbContext.Users.FindAsync(ticket.CustomerId)
                         ?? await _dbContext.Users.FirstOrDefaultAsync();
            }
        }

        var now = DateTime.UtcNow;
        var message = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = sender?.Id ?? ticket.CustomerId,
            Content = request.Content.Trim(),
            IsInternalNote = request.IsInternalNote,
            IsAiGenerated = request.IsAiGenerated,
            CreatedAtUtc = now
        };

        ticket.UpdatedAtUtc = now;

        // If an agent responds publicly, record first response SLA and progress open ticket
        if (!request.IsInternalNote && (sender?.Role == UserRole.SupportAgent || sender?.Role == UserRole.SupportManager || sender?.Role == UserRole.SystemAdministrator))
        {
            SlaPolicy.RecordFirstResponse(ticket, now);
            if (ticket.Status == TicketStatus.Open)
            {
                ticket.Status = TicketStatus.InProgress;
            }
        }

        _dbContext.TicketMessages.Add(message);
        await _dbContext.SaveChangesAsync();

        var messageDto = new TicketMessageDto(
            message.Id,
            message.TicketId,
            message.SenderId,
            sender?.FullName ?? "Support Team",
            sender?.Role.ToString() ?? "SupportAgent",
            message.Content,
            message.IsInternalNote,
            message.IsAiGenerated,
            message.CreatedAtUtc
        );

        return Ok(messageDto);
    }

    [HttpPatch("{id:guid}/status")]
    public async Task<ActionResult<TicketDto>> UpdateStatus(Guid id, [FromBody] UpdateTicketStatusRequest request)
    {
        var ticket = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        var now = DateTime.UtcNow;
        ticket.Status = request.Status;
        ticket.UpdatedAtUtc = now;

        if (request.Status == TicketStatus.Resolved || request.Status == TicketStatus.Closed)
        {
            SlaPolicy.RecordResolution(ticket, now);
        }

        await _dbContext.SaveChangesAsync();
        return Ok(MapToDto(ticket));
    }

    [HttpPatch("{id:guid}/priority")]
    public async Task<ActionResult<TicketDto>> UpdatePriority(Guid id, [FromBody] UpdateTicketPriorityRequest request)
    {
        var ticket = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        SlaPolicy.RecalculateForPriority(ticket, request.Priority);
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        await _dbContext.SaveChangesAsync();
        return Ok(MapToDto(ticket));
    }

    [HttpPatch("{id:guid}/assign")]
    public async Task<ActionResult<TicketDto>> AssignAgent(Guid id, [FromBody] AssignTicketRequest request)
    {
        var ticket = await _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (request.AgentId.HasValue)
        {
            var agent = await _dbContext.Users.FindAsync(request.AgentId.Value);
            if (agent == null)
            {
                return BadRequest(new { message = "Assigned agent does not exist." });
            }
            ticket.AssignedAgentId = agent.Id;
            ticket.AssignedAgent = agent;
            if (ticket.Status == TicketStatus.Open)
            {
                ticket.Status = TicketStatus.InProgress;
            }
        }
        else
        {
            ticket.AssignedAgentId = null;
            ticket.AssignedAgent = null;
        }

        ticket.UpdatedAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        return Ok(MapToDto(ticket));
    }

    // --- Bulk Triage Actions (Sprint 5) ---

    [HttpPost("bulk-status")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkUpdateStatus([FromBody] BulkUpdateStatusRequest request)
    {
        if (request.TicketIds == null || request.TicketIds.Count == 0)
        {
            return BadRequest(new { message = "TicketIds list cannot be empty." });
        }

        var tickets = await _dbContext.Tickets
            .Where(t => request.TicketIds.Contains(t.Id))
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var ticket in tickets)
        {
            ticket.Status = request.Status;
            ticket.UpdatedAtUtc = now;
            if (request.Status == TicketStatus.Resolved || request.Status == TicketStatus.Closed)
            {
                SlaPolicy.RecordResolution(ticket, now);
            }
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new BulkOperationResultDto(
            UpdatedCount: tickets.Count,
            AffectedTicketIds: tickets.Select(t => t.Id).ToList(),
            Message: $"Successfully updated status to {request.Status} for {tickets.Count} ticket(s)."
        ));
    }

    [HttpPost("bulk-assign")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkAssign([FromBody] BulkAssignRequest request)
    {
        if (request.TicketIds == null || request.TicketIds.Count == 0)
        {
            return BadRequest(new { message = "TicketIds list cannot be empty." });
        }

        User? agent = null;
        if (request.AgentId.HasValue)
        {
            agent = await _dbContext.Users.FindAsync(request.AgentId.Value);
            if (agent == null)
            {
                return BadRequest(new { message = "Assigned agent does not exist." });
            }
        }

        var tickets = await _dbContext.Tickets
            .Where(t => request.TicketIds.Contains(t.Id))
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var ticket in tickets)
        {
            ticket.AssignedAgentId = agent?.Id;
            ticket.UpdatedAtUtc = now;
            if (agent != null && ticket.Status == TicketStatus.Open)
            {
                ticket.Status = TicketStatus.InProgress;
            }
        }

        await _dbContext.SaveChangesAsync();

        var agentName = agent != null ? agent.FullName : "Unassigned";
        return Ok(new BulkOperationResultDto(
            UpdatedCount: tickets.Count,
            AffectedTicketIds: tickets.Select(t => t.Id).ToList(),
            Message: $"Successfully assigned {tickets.Count} ticket(s) to {agentName}."
        ));
    }

    [HttpPost("bulk-priority")]
    public async Task<ActionResult<BulkOperationResultDto>> BulkUpdatePriority([FromBody] BulkUpdatePriorityRequest request)
    {
        if (request.TicketIds == null || request.TicketIds.Count == 0)
        {
            return BadRequest(new { message = "TicketIds list cannot be empty." });
        }

        var tickets = await _dbContext.Tickets
            .Where(t => request.TicketIds.Contains(t.Id))
            .ToListAsync();

        var now = DateTime.UtcNow;
        foreach (var ticket in tickets)
        {
            SlaPolicy.RecalculateForPriority(ticket, request.Priority);
            ticket.UpdatedAtUtc = now;
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new BulkOperationResultDto(
            UpdatedCount: tickets.Count,
            AffectedTicketIds: tickets.Select(t => t.Id).ToList(),
            Message: $"Successfully updated priority to {request.Priority} for {tickets.Count} ticket(s)."
        ));
    }

    [HttpPost("{id:guid}/csat")]
    public async Task<ActionResult<CsatSurveyDto>> SubmitCsat(Guid id, [FromBody] SubmitCsatRequest request)
    {
        if (request.Rating < 1 || request.Rating > 5)
        {
            return BadRequest(new { message = "Rating must be between 1 and 5 stars." });
        }

        var ticket = await _dbContext.Tickets
            .Include(t => t.Customer)
            .Include(t => t.CsatSurvey)
            .FirstOrDefaultAsync(t => t.Id == id);

        if (ticket == null)
        {
            return NotFound(new { message = "Ticket not found." });
        }

        if (ticket.Status != TicketStatus.Resolved && ticket.Status != TicketStatus.Closed)
        {
            return BadRequest(new { message = "CSAT surveys can only be submitted for resolved or closed tickets." });
        }

        var survey = ticket.CsatSurvey;
        if (survey == null)
        {
            survey = new CsatSurvey
            {
                Id = Guid.NewGuid(),
                TicketId = ticket.Id,
                CustomerId = ticket.CustomerId,
                Rating = request.Rating,
                FeedbackComment = request.FeedbackComment,
                SubmittedAtUtc = DateTime.UtcNow
            };
            _dbContext.CsatSurveys.Add(survey);
        }
        else
        {
            survey.Rating = request.Rating;
            survey.FeedbackComment = request.FeedbackComment;
            survey.SubmittedAtUtc = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();

        return Ok(new CsatSurveyDto(
            survey.Id,
            ticket.Id,
            ticket.TicketReference,
            ticket.CustomerId,
            ticket.Customer?.FullName ?? "Customer",
            survey.Rating,
            survey.FeedbackComment,
            survey.SubmittedAtUtc
        ));
    }

    [HttpGet("categories")]
    public async Task<ActionResult<IEnumerable<TicketCategory>>> GetCategories()
    {
        var categories = await _dbContext.TicketCategories
            .Where(c => c.IsActive)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories);
    }

    private static TicketDto MapToDto(Ticket t)
    {
        var isBreached = SlaPolicy.EvaluateBreach(t, DateTime.UtcNow);
        return new TicketDto(
            t.Id,
            t.TicketReference,
            t.Title,
            t.Description,
            t.Priority.ToString(),
            t.Status.ToString(),
            t.Category?.Name,
            t.Customer?.FullName ?? "Customer",
            t.Customer?.Email ?? "",
            t.AssignedAgent?.FullName,
            t.CreatedAtUtc,
            t.UpdatedAtUtc,
            t.Messages.Count,
            t.FirstResponseDueAtUtc,
            t.ResolutionDueAtUtc,
            t.FirstResponseAtUtc,
            isBreached
        );
    }
}
