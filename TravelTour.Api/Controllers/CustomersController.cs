using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/customers")]
public class CustomersController(CustomerService customerService) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        return Ok(await customerService.GetAllAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var result = await customerService.GetByIdAsync(id);
        return result.IsNotFound ? NotFound() : Ok(result.Value);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CustomerRequest request)
    {
        var result = await customerService.CreateAsync(request);
        return result.IsSuccess
            ? CreatedAtAction(nameof(GetById), new { id = result.Value!.Id }, result.Value)
            : BadRequest(new { message = result.Error });
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CustomerRequest request)
    {
        var result = await customerService.UpdateAsync(id, request);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? Ok(result.Value) : BadRequest(new { message = result.Error });
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var result = await customerService.DeleteAsync(id);
        if (result.IsNotFound) return NotFound();
        return result.IsSuccess ? NoContent() : BadRequest(new { message = result.Error });
    }
}
