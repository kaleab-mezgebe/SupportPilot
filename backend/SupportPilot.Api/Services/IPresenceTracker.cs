namespace SupportPilot.Api.Services;

public interface IPresenceTracker
{
    Task<bool> UserConnectedAsync(string userId, string connectionId);
    Task<bool> UserDisconnectedAsync(string userId, string connectionId);
    Task<List<string>> GetOnlineUsersAsync();
    Task<bool> IsUserOnlineAsync(string userId);
}
