using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using QueueFlow.API.Data;
using QueueFlow.API.Models;

namespace QueueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly QueueDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthController(
        QueueDbContext context,
        IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    // POST: api/Auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register(
        [FromBody] RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) ||
            string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(
                "Name, email and password are required."
            );
        }

        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email);

        if (existingUser != null)
        {
            return Conflict(
                "A user with this email already exists."
            );
        }

        var role = string.IsNullOrWhiteSpace(request.Role)
            ? "Customer"
            : request.Role;

        var user = new User
        {
            Name = request.Name,
            Email = request.Email,
            Password = request.Password,
            Role = role
        };

        _context.Users.Add(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Registration successful.",
            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            }
        });
    }

    // POST: api/Auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login(
        [FromBody] LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Email) ||
            string.IsNullOrWhiteSpace(request.Password))
        {
            return BadRequest(
                "Email and password are required."
            );
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u =>
                u.Email == request.Email &&
                u.Password == request.Password);

        if (user == null)
        {
            return Unauthorized(
                "Invalid email or password."
            );
        }

        var token = GenerateJwtToken(user);

        return Ok(new
        {
            message = "Login successful.",

            token,

            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            }
        });
    }

    // --------------------------------------------------
    // Generate JWT
    // --------------------------------------------------

    private string GenerateJwtToken(User user)
    {
        var jwtKey = _configuration["Jwt:Key"];

        if (string.IsNullOrWhiteSpace(jwtKey))
        {
            throw new InvalidOperationException(
                "JWT key is missing from appsettings.json."
            );
        }

        var issuer = _configuration["Jwt:Issuer"];
        var audience = _configuration["Jwt:Audience"];

        var expiryMinutes =
            _configuration.GetValue<int>(
                "Jwt:ExpiryMinutes"
            );

        var claims = new List<Claim>
        {
            new Claim(
                ClaimTypes.NameIdentifier,
                user.Id.ToString()
            ),

            new Claim(
                ClaimTypes.Name,
                user.Name
            ),

            new Claim(
                ClaimTypes.Email,
                user.Email
            ),

            new Claim(
                ClaimTypes.Role,
                user.Role
            )
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(jwtKey)
        );

        var credentials =
            new SigningCredentials(
                key,
                SecurityAlgorithms.HmacSha256
            );

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(
                expiryMinutes
            ),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler()
            .WriteToken(token);
    }
}

public class RegisterRequest
{
    public string Name { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;

    public string Role { get; set; } = "Customer";
}

public class LoginRequest
{
    public string Email { get; set; } = string.Empty;

    public string Password { get; set; } = string.Empty;
}