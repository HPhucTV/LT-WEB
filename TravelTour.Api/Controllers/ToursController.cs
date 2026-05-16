using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/tours")]
public class ToursController(TourService tourService) : ControllerBase
{
    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await tourService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await tourService.GetByIdAsync(id);
        return result.IsNotFound ? NotFound() : Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create(TourRequest request)
    {
        var result = await tourService.CreateAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, TourRequest request)
    {
        var result = await tourService.UpdateAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await tourService.DeleteAsync(id);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }

    [HttpGet("{id:int}/schedules")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSchedules(int id)
    {
        var result = await tourService.GetSchedulesAsync(id);
        return result.IsNotFound ? NotFound() : Ok(result.Value);
    }

    [HttpPost("{id:int}/schedules")]
    public async Task<IActionResult> CreateSchedule(int id, ScheduleRequest request)
    {
        var result = await tourService.CreateScheduleAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Created($"/api/tours/{id}/schedules", result.Value);
    }
}
