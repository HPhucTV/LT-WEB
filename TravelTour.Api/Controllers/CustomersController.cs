using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Controllers;

[Authorize]
[ApiController]
[Route("api/customers")]
public class CustomersController(AppDbContext db) : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await db.Customers
            .AsNoTracking()
            .OrderBy(c => c.FullName)
            .Select(c => new CustomerResponse(
                c.Id, c.FullName, c.Phone, c.Email, c.Address, c.CreatedAt))
            .ToListAsync();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var customer = await db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);

        return customer is null
            ? NotFound()
            : Ok(new CustomerResponse(customer.Id, customer.FullName, customer.Phone,
                customer.Email, customer.Address, customer.CreatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create(CustomerRequest request)
    {
        var error = Validate(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        var customer = new Customer
        {
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim() ?? "",
            Address = request.Address?.Trim() ?? ""
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = customer.Id },
            new CustomerResponse(customer.Id, customer.FullName, customer.Phone,
                customer.Email, customer.Address, customer.CreatedAt));
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, CustomerRequest request)
    {
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null)
        {
            return NotFound();
        }

        var error = Validate(request);
        if (error is not null)
        {
            return BadRequest(new { message = error });
        }

        customer.FullName = request.FullName.Trim();
        customer.Phone = request.Phone.Trim();
        customer.Email = request.Email?.Trim() ?? "";
        customer.Address = request.Address?.Trim() ?? "";

        await db.SaveChangesAsync();

        return Ok(new CustomerResponse(customer.Id, customer.FullName, customer.Phone,
            customer.Email, customer.Address, customer.CreatedAt));
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null)
        {
            return NotFound();
        }

        var hasBookings = await db.Bookings.AnyAsync(b => b.CustomerId == id);
        if (hasBookings)
        {
            return BadRequest(new { message = "Không thể xoá khách hàng đang có đặt tour." });
        }

        db.Customers.Remove(customer);
        await db.SaveChangesAsync();

        return NoContent();
    }

    private static string? Validate(CustomerRequest r)
    {
        if (string.IsNullOrWhiteSpace(r.FullName)) return "Họ tên không được để trống.";
        if (string.IsNullOrWhiteSpace(r.Phone)) return "Số điện thoại không được để trống.";
        return null;
    }
}
