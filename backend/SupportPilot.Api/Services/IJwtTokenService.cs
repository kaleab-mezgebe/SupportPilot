using SupportPilot.Api.Entities;

namespace SupportPilot.Api.Services;

public interface IJwtTokenService
{
    string GenerateToken(User user);
}
