using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;

namespace SupportPilot.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _dbContext;
    private readonly IPasswordHasher _passwordHasher;
    private readonly IJwtTokenService _jwtTokenService;

    public AuthController(
        AppDbContext dbContext,
        IPasswordHasher passwordHasher,
        IJwtTokenService jwtTokenService)
    {
        _dbContext = dbContext;
        _passwordHasher = passwordHasher;
        _jwtTokenService = jwtTokenService;
    }

    [HttpPost("register")]
    public async Task<ActionResult<AuthResponseDto>> Register([FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        if (await _dbContext.Users.AnyAsync(u => u.Email.ToLower() == normalizedEmail))
        {
            return Conflict(new { message = "A user with this email address already exists." });
        }

        Organization? organization = null;
        if (!string.IsNullOrWhiteSpace(request.OrganizationName))
        {
            var orgSlug = request.OrganizationName.Trim().ToLowerInvariant().Replace(" ", "-");
            organization = await _dbContext.Organizations.FirstOrDefaultAsync(o => o.Slug == orgSlug)
                           ?? new Organization
                           {
                               Id = Guid.NewGuid(),
                               Name = request.OrganizationName.Trim(),
                               Slug = orgSlug,
                               CreatedAtUtc = DateTime.UtcNow
                           };

            if (_dbContext.Entry(organization).State == EntityState.Detached)
            {
                _dbContext.Organizations.Add(organization);
            }
        }
        else
        {
            organization = await _dbContext.Organizations.FirstOrDefaultAsync();
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = normalizedEmail,
            FullName = string.IsNullOrWhiteSpace(request.FullName) ? normalizedEmail.Split('@')[0] : request.FullName.Trim(),
            PasswordHash = _passwordHasher.HashPassword(request.Password),
            Role = request.Role,
            OrganizationId = organization?.Id,
            CreatedAtUtc = DateTime.UtcNow,
            IsActive = true
        };

        _dbContext.Users.Add(user);
        await _dbContext.SaveChangesAsync();

        var token = _jwtTokenService.GenerateToken(user);
        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.OrganizationId,
            organization?.Name,
            user.CreatedAtUtc
        );

        return Ok(new AuthResponseDto(token, userDto));
    }

    [HttpPost("login")]
    public async Task<ActionResult<AuthResponseDto>> Login([FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(new { message = "Email and password are required." });
        }

        var normalizedEmail = request.Email.Trim().ToLowerInvariant();
        var user = await _dbContext.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == normalizedEmail);

        if (user == null || !_passwordHasher.VerifyPassword(request.Password, user.PasswordHash))
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        user.LastLoginAtUtc = DateTime.UtcNow;
        await _dbContext.SaveChangesAsync();

        var token = _jwtTokenService.GenerateToken(user);
        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.OrganizationId,
            user.Organization?.Name,
            user.CreatedAtUtc
        );

        return Ok(new AuthResponseDto(token, userDto));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserDto>> GetCurrentUser()
    {
        var userIdClaim = ControllerContext?.HttpContext?.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value 
                          ?? ControllerContext?.HttpContext?.User?.FindFirst(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Sub)?.Value;

        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
        {
            return Unauthorized(new { message = "Invalid or expired token." });
        }

        var user = await _dbContext.Users
            .Include(u => u.Organization)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
        {
            return NotFound(new { message = "User not found." });
        }

        var userDto = new UserDto(
            user.Id,
            user.Email,
            user.FullName,
            user.Role.ToString(),
            user.OrganizationId,
            user.Organization?.Name,
            user.CreatedAtUtc
        );

        return Ok(userDto);
    }

    [HttpGet("agents")]
    public async Task<ActionResult<IEnumerable<UserDto>>> GetSupportAgents()
    {
        var agents = await _dbContext.Users
            .Include(u => u.Organization)
            .Where(u => u.Role == UserRole.SupportAgent || u.Role == UserRole.SupportManager || u.Role == UserRole.SystemAdministrator)
            .Select(u => new UserDto(
                u.Id,
                u.Email,
                u.FullName,
                u.Role.ToString(),
                u.OrganizationId,
                u.Organization != null ? u.Organization.Name : null,
                u.CreatedAtUtc
            ))
            .ToListAsync();

        return Ok(agents);
    }
}
