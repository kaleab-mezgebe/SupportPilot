using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using SupportPilot.Api.Controllers;
using SupportPilot.Api.Data;
using SupportPilot.Api.DTOs;
using SupportPilot.Api.Entities;
using SupportPilot.Api.Services;
using Xunit;

namespace SupportPilot.UnitTests;

public class AuthControllerTests
{
    private AppDbContext CreateInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new AppDbContext(options);
    }

    private IConfiguration CreateConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            {"Jwt:Key", "UnitTestingSecretKeyForSupportPilotJWTAuthentication2026_Minimum_32_Bytes!"},
            {"Jwt:Issuer", "SupportPilot.Api"},
            {"Jwt:Audience", "SupportPilot.Client"},
            {"Jwt:ExpirationHours", "24"}
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();
    }

    [Fact]
    public async Task Register_CreatesNewUser_AndReturnsToken()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var passwordHasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);
        var controller = new AuthController(context, passwordHasher, jwtService);

        var request = new RegisterRequest(
            FullName: "Jane Doe",
            Email: "jane.doe@example.com",
            Password: "SecurePassword123!",
            Role: UserRole.Customer
        );

        // Act
        var result = await controller.Register(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var authResponse = Assert.IsType<AuthResponseDto>(okResult.Value);
        Assert.NotNull(authResponse.Token);
        Assert.Equal("jane.doe@example.com", authResponse.User.Email);
        Assert.Equal("Customer", authResponse.User.Role);
    }

    [Fact]
    public async Task Login_WithValidCredentials_ReturnsToken()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var passwordHasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "agent@supportpilot.io",
            FullName = "Agent Smith",
            PasswordHash = passwordHasher.HashPassword("Password123!"),
            Role = UserRole.SupportAgent,
            CreatedAtUtc = DateTime.UtcNow
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, passwordHasher, jwtService);

        var request = new LoginRequest(
            Email: "agent@supportpilot.io",
            Password: "Password123!"
        );

        // Act
        var result = await controller.Login(request);

        // Assert
        var okResult = Assert.IsType<OkObjectResult>(result.Result);
        var authResponse = Assert.IsType<AuthResponseDto>(okResult.Value);
        Assert.NotNull(authResponse.Token);
        Assert.Equal("Agent Smith", authResponse.User.FullName);
        Assert.Equal("SupportAgent", authResponse.User.Role);
    }

    [Fact]
    public async Task Login_WithInvalidPassword_ReturnsUnauthorized()
    {
        // Arrange
        using var context = CreateInMemoryDbContext();
        var passwordHasher = new PasswordHasher();
        var config = CreateConfiguration();
        var jwtService = new JwtTokenService(config);

        var existingUser = new User
        {
            Id = Guid.NewGuid(),
            Email = "agent@supportpilot.io",
            FullName = "Agent Smith",
            PasswordHash = passwordHasher.HashPassword("Password123!"),
            Role = UserRole.SupportAgent,
            CreatedAtUtc = DateTime.UtcNow
        };
        context.Users.Add(existingUser);
        await context.SaveChangesAsync();

        var controller = new AuthController(context, passwordHasher, jwtService);

        var request = new LoginRequest(
            Email: "agent@supportpilot.io",
            Password: "WrongPassword!"
        );

        // Act
        var result = await controller.Login(request);

        // Assert
        Assert.IsType<UnauthorizedObjectResult>(result.Result);
    }
}
