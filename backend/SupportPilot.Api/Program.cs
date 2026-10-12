using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using SupportPilot.Api.Data;
using SupportPilot.Api.Hubs;
using SupportPilot.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Dependency Injection
builder.Services.AddSingleton<IPasswordHasher, PasswordHasher>();
builder.Services.AddSingleton<IJwtTokenService, JwtTokenService>();
builder.Services.AddScoped<ISemanticSearchService, SemanticSearchService>();
builder.Services.AddScoped<IGroundedRagService, GroundedRagService>();
builder.Services.AddSingleton<IPresenceTracker, PresenceTracker>();

// Add SignalR (Sprint 7)
builder.Services.AddSignalR();

// Configure JWT Bearer Authentication
var jwtSecretKey = builder.Configuration["Jwt:Key"] ?? "SupportPilot_Super_Secret_Key_For_Jwt_Auth_2026_Minimum_32_Bytes_Long!";
var jwtIssuer = builder.Configuration["Jwt:Issuer"] ?? "SupportPilot.Api";
var jwtAudience = builder.Configuration["Jwt:Audience"] ?? "SupportPilot.Client";

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtIssuer,
        ValidAudience = jwtAudience,
        IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecretKey))
    };

    // Support JWT auth in WebSockets for SignalR
    options.Events = new JwtBearerEvents
    {
        OnMessageReceived = context =>
        {
            var accessToken = context.Request.Query["access_token"];
            var path = context.HttpContext.Request.Path;
            if (!string.IsNullOrEmpty(accessToken) && path.StartsWithSegments("/hubs"))
            {
                context.Token = accessToken;
            }
            return Task.CompletedTask;
        }
    };
});

builder.Services.AddAuthorization();

// Configure Swagger with JWT Bearer Support
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "SupportPilot API",
        Version = "v1",
        Description = "AI-powered customer service platform backend"
    });

    options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "Bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "Enter JWT token in format: Bearer {token}"
    });

    options.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// Configure CORS for local React development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins(
                "http://localhost:3000",
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "http://localhost:5000"
            )
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

// Configure PostgreSQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=supportpilot_db;Username=supportpilot;Password=supportpilot_secret";

builder.Services.AddDbContext<AppDbContext>(options =>
{
    options.UseNpgsql(connectionString);
});

var app = builder.Build();

// Seed database on startup (with graceful handling if db is not yet reachable during pure unit run)
try
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DbInitializer.SeedAsync(dbContext);
}
catch (Exception ex)
{
    app.Logger.LogWarning(ex, "Database seeding was skipped or encountered an error (e.g. offline DB).");
}

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "SupportPilot API v1");
        c.RoutePrefix = "swagger";
    });
}

app.UseCors("AllowFrontend");

app.UseHttpsRedirection();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<SupportChatHub>("/hubs/chat");

app.Run();

// Make Program visible to WebApplicationFactory integration tests
public partial class Program { }
