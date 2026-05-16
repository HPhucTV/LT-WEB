using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;

namespace TravelTour.Api.Services;

public class CustomerService(AppDbContext db)
{
    public async Task<List<CustomerResponse>> GetAllAsync()
    {
        return await db.Customers
            .AsNoTracking()
            .OrderBy(c => c.FullName)
            .Select(c => new CustomerResponse(c.Id, c.FullName, c.Phone, c.Email, c.Address, c.CreatedAt))
            .ToListAsync();
    }

    public async Task<ServiceResult<CustomerResponse>> GetByIdAsync(int id)
    {
        var customer = await db.Customers.AsNoTracking().FirstOrDefaultAsync(c => c.Id == id);
        return customer is null
            ? ServiceResult<CustomerResponse>.NotFound()
            : ServiceResult<CustomerResponse>.Success(ToResponse(customer));
    }

    public async Task<ServiceResult<CustomerResponse>> CreateAsync(CustomerRequest request)
    {
        var error = Validate(request);
        if (error is not null) return ServiceResult<CustomerResponse>.BadRequest(error);

        var customer = new Customer
        {
            FullName = request.FullName.Trim(),
            Phone = request.Phone.Trim(),
            Email = request.Email?.Trim() ?? "",
            Address = request.Address?.Trim() ?? ""
        };

        db.Customers.Add(customer);
        await db.SaveChangesAsync();

        return ServiceResult<CustomerResponse>.Success(ToResponse(customer));
    }

    public async Task<ServiceResult<CustomerResponse>> UpdateAsync(int id, CustomerRequest request)
    {
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null) return ServiceResult<CustomerResponse>.NotFound();

        var error = Validate(request);
        if (error is not null) return ServiceResult<CustomerResponse>.BadRequest(error);

        customer.FullName = request.FullName.Trim();
        customer.Phone = request.Phone.Trim();
        customer.Email = request.Email?.Trim() ?? "";
        customer.Address = request.Address?.Trim() ?? "";

        await db.SaveChangesAsync();
        return ServiceResult<CustomerResponse>.Success(ToResponse(customer));
    }

    public async Task<ServiceResult> DeleteAsync(int id)
    {
        var customer = await db.Customers.FirstOrDefaultAsync(c => c.Id == id);
        if (customer is null) return ServiceResult.NotFound();

        if (await db.Bookings.AnyAsync(b => b.CustomerId == id))
        {
            return ServiceResult.BadRequest("Không thể xoá khách hàng đang có đặt tour.");
        }

        db.Customers.Remove(customer);
        await db.SaveChangesAsync();
        return ServiceResult.Success();
    }

    private static CustomerResponse ToResponse(Customer customer)
    {
        return new CustomerResponse(customer.Id, customer.FullName, customer.Phone, customer.Email, customer.Address, customer.CreatedAt);
    }

    private static string? Validate(CustomerRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.FullName)) return "Họ tên không được để trống.";
        if (string.IsNullOrWhiteSpace(request.Phone)) return "Số điện thoại không được để trống.";
        return null;
    }
}
