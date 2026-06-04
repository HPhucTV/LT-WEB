using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/bookings")]
public class BookingsController(BookingService bookingService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await bookingService.GetAllAsync());
    }

    [HttpPost]
    public async Task<IActionResult> Create(BookingRequest request)
    {
        var result = await bookingService.CreateAsync(request);
        if (!result.IsSuccess)
        {
            return BadRequest(new { message = result.Error });
        }

        return Created($"/api/bookings/{result.Value!.Id}", result.Value);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateStatus(int id, BookingStatusUpdate update)
    {
        var result = await bookingService.UpdateStatusAsync(id, update);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}/assign-guide")]
    public async Task<IActionResult> AssignGuide(int id, AssignGuideRequest request)
    {
        var result = await bookingService.AssignGuideAsync(id, request);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await bookingService.DeleteAsync(id);
        if (result.IsNotFound)
        {
            return NotFound();
        }

        return NoContent();
    }
}
