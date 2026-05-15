using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Data;

namespace TravelTour.Api.Controllers;

[Authorize(Roles = "Admin")]
[ApiController]
[Route("api/users")]
public class UsersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var users = await db.Users
            .AsNoTracking()
            .OrderByDescending(u => u.CreatedAt)
            .Select(u => new { u.Id, u.Username, u.FullName, u.Role, u.CreatedAt })
            .ToListAsync();

        return Ok(users);
    }

    [HttpPut("{id:int}/role")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        var allowedRoles = new[] { "Admin", "Staff", "Customer" };
        if (!allowedRoles.Contains(request.Role))
            return BadRequest(new { message = "Role không hợp lệ." });

        user.Role = request.Role;
        await db.SaveChangesAsync();

        return Ok(new { user.Id, user.Username, user.FullName, user.Role, user.CreatedAt });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var user = await db.Users.FindAsync(id);
        if (user is null) return NotFound();

        db.Users.Remove(user);
        await db.SaveChangesAsync();

        return NoContent();
    }
}

public record UpdateRoleRequest(string Role);
