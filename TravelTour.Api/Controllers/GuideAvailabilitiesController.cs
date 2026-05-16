using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/guide-availabilities")]
public class GuideAvailabilitiesController(GuideAvailabilityService guideAvailabilityService) : ControllerBase
{
    [HttpGet("my")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> GetMine()
    {
        var result = await guideAvailabilityService.GetMineAsync(CurrentUsername());
        return result.IsSuccess ? Ok(result.Value) : Unauthorized();
    }

    [HttpPost]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Create(GuideAvailabilityRequest request)
    {
        var result = await guideAvailabilityService.CreateAsync(CurrentUsername(), request);
        if (!result.IsSuccess)
        {
            return result.Error == "Unauthorized" ? Unauthorized() : BadRequest(new { message = result.Error });
        }

        return Created($"/api/guide-availabilities/{result.Value!.Id}", result.Value);
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Update(int id, GuideAvailabilityRequest request)
    {
        var result = await guideAvailabilityService.UpdateAsync(CurrentUsername(), id, request);
        if (result.IsNotFound) return NotFound();
        if (!result.IsSuccess)
        {
            return result.Error == "Unauthorized" ? Unauthorized() : BadRequest(new { message = result.Error });
        }

        return Ok(result.Value);
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Staff")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await guideAvailabilityService.DeleteAsync(CurrentUsername(), id);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? NoContent() : Unauthorized();
    }

    [HttpGet("/api/guides/available")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAvailableGuides([FromQuery] DateOnly startDate, [FromQuery] DateOnly endDate)
    {
        var result = await guideAvailabilityService.GetAvailableGuidesAsync(startDate, endDate);
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    private string? CurrentUsername()
    {
        return User.FindFirstValue(ClaimTypes.Name);
    }
}
