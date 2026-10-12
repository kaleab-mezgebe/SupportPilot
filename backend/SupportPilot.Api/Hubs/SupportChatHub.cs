using System.Security.Claims;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Hubs;

public class SupportChatHub : Hub
{
    private readonly AppDbContext _dbContext;
    private readonly IPresenceTracker _presenceTracker;

    public SupportChatHub(AppDbContext dbContext, IPresenceTracker presenceTracker)
    {
        _dbContext = dbContext;
        _presenceTracker = presenceTracker;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetCurrentUserId() ?? Context.ConnectionId;
        var userName = GetCurrentUserName() ?? "Guest User";

        var isFirstConnection = await _presenceTracker.UserConnectedAsync(userId, Context.ConnectionId);
        if (isFirstConnection)
        {
            await Clients.Others.SendAsync("UserPresenceChanged", new
            {
                userId,
                userName,
                status = "online",
                timestampUtc = DateTime.UtcNow
            });
        }

        // Send list of currently online users to the connecting client
        var onlineUsers = await _presenceTracker.GetOnlineUsersAsync();
        await Clients.Caller.SendAsync("OnlineUsersList", onlineUsers);

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetCurrentUserId() ?? Context.ConnectionId;
        var userName = GetCurrentUserName() ?? "Guest User";

        var isOffline = await _presenceTracker.UserDisconnectedAsync(userId, Context.ConnectionId);
        if (isOffline)
        {
            await Clients.Others.SendAsync("UserPresenceChanged", new
            {
                userId,
                userName,
                status = "offline",
                timestampUtc = DateTime.UtcNow
            });
        }

        await base.OnDisconnectedAsync(exception);
    }

    /// <summary>
    /// Joins a real-time conversation group for a given ticket.
    /// </summary>
    public async Task JoinTicketConversation(string ticketId)
    {
        if (string.IsNullOrWhiteSpace(ticketId)) return;

        var groupName = GetGroupName(ticketId);
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);

        var userName = GetCurrentUserName() ?? "Agent";
        await Clients.OthersInGroup(groupName).SendAsync("UserJoinedConversation", new
        {
            ticketId,
            userName,
            timestampUtc = DateTime.UtcNow
        });
    }

    /// <summary>
    /// Leaves a ticket conversation group.
    /// </summary>
    public async Task LeaveTicketConversation(string ticketId)
    {
        if (string.IsNullOrWhiteSpace(ticketId)) return;

        var groupName = GetGroupName(ticketId);
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    /// <summary>
    /// Broadcasts live typing indicators to other members in the conversation.
    /// </summary>
    public async Task SendTyping(string ticketId, bool isTyping)
    {
        if (string.IsNullOrWhiteSpace(ticketId)) return;

        var groupName = GetGroupName(ticketId);
        var senderName = GetCurrentUserName() ?? "User";
        var senderId = GetCurrentUserId() ?? Context.ConnectionId;

        await Clients.OthersInGroup(groupName).SendAsync("UserTyping", new
        {
            ticketId,
            senderId,
            senderName,
            isTyping
        });
    }

    /// <summary>
    /// Sends a real-time message, persists it in PostgreSQL, evaluates SLAs, and broadcasts to group.
    /// </summary>
    public async Task SendMessage(string ticketId, string content, bool isInternalNote = false)
    {
        if (string.IsNullOrWhiteSpace(ticketId) || string.IsNullOrWhiteSpace(content)) return;

        if (!Guid.TryParse(ticketId, out var ticketGuid)) return;

        var ticket = await _dbContext.Tickets
            .Include(t => t.Customer)
            .Include(t => t.AssignedAgent)
            .FirstOrDefaultAsync(t => t.Id == ticketGuid);

        if (ticket == null) return;

        // Resolve Sender
        User? sender = null;
        var userIdStr = GetCurrentUserId();
        if (!string.IsNullOrEmpty(userIdStr) && Guid.TryParse(userIdStr, out var senderGuid))
        {
            sender = await _dbContext.Users.FindAsync(senderGuid);
        }

        if (sender == null)
        {
            // Fallback to assigned agent or customer
            sender = isInternalNote 
                ? await _dbContext.Users.FirstOrDefaultAsync(u => u.Role == UserRole.SupportAgent)
                : await _dbContext.Users.FindAsync(ticket.CustomerId) ?? await _dbContext.Users.FirstOrDefaultAsync();
        }

        // Security check: Customer accounts cannot author internal notes
        if (sender?.Role == UserRole.Customer)
        {
            isInternalNote = false;
        }

        var now = DateTime.UtcNow;
        var message = new TicketMessage
        {
            Id = Guid.NewGuid(),
            TicketId = ticket.Id,
            SenderId = sender?.Id ?? ticket.CustomerId,
            Content = content.Trim(),
            IsInternalNote = isInternalNote,
            IsAiGenerated = false,
            CreatedAtUtc = now
        };

        ticket.UpdatedAtUtc = now;

        // SLA First Response tracking
        if (!isInternalNote && (sender?.Role == UserRole.SupportAgent || sender?.Role == UserRole.SupportManager || sender?.Role == UserRole.SystemAdministrator))
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

        var groupName = GetGroupName(ticketId);
        await Clients.Group(groupName).SendAsync("ReceiveMessage", messageDto);

        // Global event to notify inbox / dashboard listeners of new ticket activity
        await Clients.All.SendAsync("TicketActivity", new
        {
            ticketId = ticket.Id,
            ticketReference = ticket.TicketReference,
            senderName = messageDto.SenderName,
            contentSnippet = content.Length > 80 ? content.Substring(0, 77) + "..." : content,
            status = ticket.Status.ToString(),
            updatedAtUtc = now
        });
    }

    private string? GetCurrentUserId()
    {
        return Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
               ?? Context.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;
    }

    private string? GetCurrentUserName()
    {
        return Context.User?.FindFirst(ClaimTypes.Name)?.Value
               ?? Context.User?.Identity?.Name;
    }

    private static string GetGroupName(string ticketId) => $"ticket_{ticketId}";
}
