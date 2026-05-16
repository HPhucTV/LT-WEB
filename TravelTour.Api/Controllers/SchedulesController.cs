using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/schedules")]
public class SchedulesController(ScheduleService scheduleService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] int? tourId, [FromQuery] string? status)
    {
        return Ok(await scheduleService.GetAllAsync(tourId, status));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, ScheduleRequest request)
    {
        var result = await scheduleService.UpdateAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/assign-guide")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> AssignGuide(int id, AssignGuideRequest request)
    {
        var result = await scheduleService.AssignGuideAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await scheduleService.DeleteAsync(id);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }
}
