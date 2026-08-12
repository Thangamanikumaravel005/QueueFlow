using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using QueueFlow.API.Data;

namespace QueueFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UserController : ControllerBase
{
    private readonly QueueDbContext _context;

    public UserController(QueueDbContext context)
    {
        _context = context;
    }

    // =========================================================
    // GET: api/User
    // Get all users
    // =========================================================

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _context.Users
            .OrderBy(u => u.Id)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role
            })
            .ToListAsync();

        return Ok(users);
    }


    // =========================================================
    // GET: api/User/{id}
    // Get one user
    // =========================================================

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetUser(int id)
    {
        var user = await _context.Users
            .Where(u => u.Id == id)
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.Role
            })
            .FirstOrDefaultAsync();

        if (user == null)
        {
            return NotFound(
                "User not found."
            );
        }

        return Ok(user);
    }


    // =========================================================
    // PUT: api/User/{id}/role
    // Change user role
    // =========================================================

    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> ChangeRole(
        int id,
        [FromBody] ChangeRoleRequest request)
    {
        if (request == null ||
            string.IsNullOrWhiteSpace(request.Role))
        {
            return BadRequest(
                "Role is required."
            );
        }

        var allowedRoles = new[]
        {
            "Admin",
            "Staff",
            "Customer"
        };

        var role = request.Role.Trim();

        if (!allowedRoles.Any(
                r => r.Equals(
                    role,
                    StringComparison.OrdinalIgnoreCase)))
        {
            return BadRequest(
                "Role must be Admin, Staff or Customer."
            );
        }

        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(
                "User not found."
            );
        }

        user.Role =
            allowedRoles.First(
                r => r.Equals(
                    role,
                    StringComparison.OrdinalIgnoreCase));

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "User role updated successfully.",

            user = new
            {
                user.Id,
                user.Name,
                user.Email,
                user.Role
            }
        });
    }


    // =========================================================
    // DELETE: api/User/{id}
    // Delete user
    // =========================================================

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(
        int id)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == id);

        if (user == null)
        {
            return NotFound(
                "User not found."
            );
        }

        _context.Users.Remove(user);

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message =
                "User deleted successfully."
        });
    }
}


// =============================================================
// Request Models
// =============================================================

public class ChangeRoleRequest
{
    public string Role { get; set; } =
        string.Empty;
}