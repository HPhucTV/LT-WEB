using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/users")]
public class UsersController(UserManagementService userService) : ControllerBase
{
    [HttpGet]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await userService.GetAllAsync());
    }

    [HttpGet("sales")]
    [Authorize(Roles = "Admin,Sales")]
    public async Task<IActionResult> GetSales()
    {
        return Ok(await userService.GetSalesAsync());
    }

    [HttpPut("{id:int}/role")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateRole(int id, [FromBody] UpdateRoleRequest request)
    {
        var result = await userService.UpdateRoleAsync(id, request);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await userService.DeleteAsync(id);
        return result.IsNotFound ? NotFound() : NoContent();
    }
}

public record UpdateRoleRequest(string Role);
