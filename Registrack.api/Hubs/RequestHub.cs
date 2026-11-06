using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.Authorization;

namespace Doctrack_backend_api.Hubs;

[Authorize]
public class RequestHub : Hub
{
    private readonly ILogger<RequestHub> _logger;

    public RequestHub(ILogger<RequestHub> logger)
    {
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        var role = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.Role)?.Value;

        _logger.LogInformation("🔗 SignalR Connected: UserId={UserId}, Role={Role}", userId, role);

        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"user_{userId}");
        }

        if (role == "Admin" || role == "Staff")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
            _logger.LogInformation("👑 Admin/Staff {UserId} joined admins group", userId);
        }
        else if (role == "Student")
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, "students");
            _logger.LogInformation("🎓 Student {UserId} joined students group", userId);
        }
        else
        {
            _logger.LogWarning("❓ Unknown role '{Role}' for user {UserId}", role, userId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = Context.User?.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value;
        _logger.LogInformation("🔌 SignalR Disconnected: UserId={UserId}", userId);
        await base.OnDisconnectedAsync(exception);
    }
}
