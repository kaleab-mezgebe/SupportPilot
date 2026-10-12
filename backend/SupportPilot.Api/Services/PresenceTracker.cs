using System.Collections.Concurrent;

namespace SupportPilot.Api.Services;

public class PresenceTracker : IPresenceTracker
{
    // Thread-safe map: UserId -> Set of active ConnectionIds
    private static readonly ConcurrentDictionary<string, HashSet<string>> OnlineUsers = new();

    public Task<bool> UserConnectedAsync(string userId, string connectionId)
    {
        var isFirstConnection = false;
        OnlineUsers.AddOrUpdate(
            userId,
            _ =>
            {
                isFirstConnection = true;
                return new HashSet<string> { connectionId };
            },
            (_, connections) =>
            {
                lock (connections)
                {
                    connections.Add(connectionId);
                }
                return connections;
            });

        return Task.FromResult(isFirstConnection);
    }

    public Task<bool> UserDisconnectedAsync(string userId, string connectionId)
    {
        var isCompletelyOffline = false;

        if (OnlineUsers.TryGetValue(userId, out var connections))
        {
            lock (connections)
            {
                connections.Remove(connectionId);
                if (connections.Count == 0)
                {
                    OnlineUsers.TryRemove(userId, out _);
                    isCompletelyOffline = true;
                }
            }
        }

        return Task.FromResult(isCompletelyOffline);
    }

    public Task<List<string>> GetOnlineUsersAsync()
    {
        var users = OnlineUsers.Keys.ToList();
        return Task.FromResult(users);
    }

    public Task<bool> IsUserOnlineAsync(string userId)
    {
        var isOnline = OnlineUsers.ContainsKey(userId);
        return Task.FromResult(isOnline);
    }
}
