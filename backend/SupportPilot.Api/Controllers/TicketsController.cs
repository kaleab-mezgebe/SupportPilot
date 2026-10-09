using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;

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

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TicketDto>>> GetTickets(
        [FromQuery] string? status,
        [FromQuery] string? priority,
        [FromQuery] string? search,
        [FromQuery] Guid? agentId,
        [FromQuery] Guid? customerId)
    {
        var query = _dbContext.Tickets
            .Include(t => t.Category)
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .Include(t => t.Messages)
            .AsNoTracking()
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) && status != "All")
        {
            if (Enum.TryParse<TicketStatus>(status, true, out var parsedStatus))
            {
                query = query.Where(t => t.Status == parsedStatus);
            }
        }

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

        if (customerId.HasValue)
        {
            query = query.Where(t => t.CustomerId == customerId.Value);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var searchLower = search.Trim().ToLower();
            query = query.Where(t =>
                t.Title.ToLower().Contains(searchLower) ||
                t.TicketReference.ToLower().Contains(searchLower) ||
                (t.Customer != null && t.Customer.FullName.ToLower().Contains(searchLower)) ||
                (t.Customer != null && t.Customer.Email.ToLower().Contains(searchLower)));
        }

        var tickets = await query
            .OrderByDescending(t => t.CreatedAtUtc)
            .Select(t => new TicketDto(
                t.Id,
                t.TicketReference,
                t.Title,
                t.Description,
                t.Priority.ToString(),
                t.Status.ToString(),
                t.Category != null ? t.Category.Name : null,
                t.Customer != null ? t.Customer.FullName : "Anonymous Customer",
                t.Customer != null ? t.Customer.Email : "support@customer.io",
                t.AssignedAgent != null ? t.AssignedAgent.FullName : null,
                t.CreatedAtUtc,
                t.UpdatedAtUtc,
                t.Messages.Count
            ))
            .ToListAsync();

        return Ok(tickets);
    }

    [HttpGet("{id:guid}")]
    public async Task<ActionResult<TicketDetailDto>> GetById(Guid id)
    {
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
            ticket.Messages
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
                .ToList()
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

        // Determine Customer
        User? customer = null;
        var userIdClaim = ControllerContext?.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? ControllerContext?.HttpContext?.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            customer = await _dbContext.Users.FindAsync(userId);
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
            OrganizationId = customer.OrganizationId,
            CreatedAtUtc = DateTime.UtcNow,
            UpdatedAtUtc = DateTime.UtcNow
        };

        // Create initial message
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

        var resultDto = new TicketDto(
            ticket.Id,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.Priority.ToString(),
            ticket.Status.ToString(),
            category?.Name,
            customer.FullName,
            customer.Email,
            null,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc,
            1
        );

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

        User? sender = null;
        var userIdClaim = ControllerContext?.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                          ?? ControllerContext?.HttpContext?.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (!string.IsNullOrEmpty(userIdClaim) && Guid.TryParse(userIdClaim, out var userId))
        {
            sender = await _dbContext.Users.FindAsync(userId);
        }

        if (sender == null)
        {
            // Fallback to assigned agent or customer or first agent
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

        var message = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = sender?.Id ?? ticket.CustomerId,
            Content = request.Content.Trim(),
            IsInternalNote = request.IsInternalNote,
            IsAiGenerated = request.IsAiGenerated,
            CreatedAtUtc = DateTime.UtcNow
        };

        ticket.UpdatedAtUtc = DateTime.UtcNow;
        if (ticket.Status == TicketStatus.Open && sender?.Role == UserRole.SupportAgent)
        {
            ticket.Status = TicketStatus.InProgress;
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

        ticket.Status = request.Status;
        ticket.UpdatedAtUtc = DateTime.UtcNow;

        if (request.Status == TicketStatus.Resolved || request.Status == TicketStatus.Closed)
        {
            ticket.ResolvedAtUtc = DateTime.UtcNow;
        }

        await _dbContext.SaveChangesAsync();

        var dto = new TicketDto(
            ticket.Id,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.Priority.ToString(),
            ticket.Status.ToString(),
            ticket.Category?.Name,
            ticket.Customer?.FullName ?? "Customer",
            ticket.Customer?.Email ?? "",
            ticket.AssignedAgent?.FullName,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc,
            ticket.Messages.Count
        );

        return Ok(dto);
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

        var dto = new TicketDto(
            ticket.Id,
            ticket.TicketReference,
            ticket.Title,
            ticket.Description,
            ticket.Priority.ToString(),
            ticket.Status.ToString(),
            ticket.Category?.Name,
            ticket.Customer?.FullName ?? "Customer",
            ticket.Customer?.Email ?? "",
            ticket.AssignedAgent?.FullName,
            ticket.CreatedAtUtc,
            ticket.UpdatedAtUtc,
            ticket.Messages.Count
        );

        return Ok(dto);
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
}
