using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace TravelTour.Api.Services;

public class AuthService(AppDbContext db, TokenService tokenService, PasswordService passwordService)
{
    public async Task<ServiceResult<AuthResponse>> LoginAsync(LoginRequest request)
    {
        var error = ValidateRegisterInput(request.Username, request.Password, checkPasswordLength: false);
        if (error is not null) return ServiceResult<AuthResponse>.BadRequest(error);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim());
        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
        {
            return ServiceResult<AuthResponse>.BadRequest("Tài khoản hoặc mật khẩu không đúng.");
        }

        return ServiceResult<AuthResponse>.Success(ToAuthResponse(user, tokenService.GenerateToken(user)));
    }

    public async Task<ServiceResult<AuthResponse>> RegisterAsync(RegisterRequest request)
    {
        var error = ValidateRegisterInput(request.Username, request.Password, checkPasswordLength: true);
        if (error is not null) return ServiceResult<AuthResponse>.BadRequest(error);

        if (await db.Users.AnyAsync(u => u.Username == request.Username.Trim()))
        {
            return ServiceResult<AuthResponse>.BadRequest("Tên đăng nhập đã tồn tại.");
        }

        var role = await db.Users.AnyAsync() ? "Customer" : "Admin";
        var user = CreateUser(request, role);

        db.Users.Add(user);

        if (role == "Customer")
        {
            var customer = new Customer
            {
                FullName = user.FullName,
                Email = !string.IsNullOrWhiteSpace(request.Email)
                    ? request.Email.Trim()
                    : (request.Username.Contains('@') ? request.Username.Trim() : ""),
                Phone = request.Phone?.Trim() ?? "",
                Address = request.Address?.Trim() ?? "",
                CreatedAt = DateTime.UtcNow
            };
            db.Customers.Add(customer);
        }

        await db.SaveChangesAsync();

        return ServiceResult<AuthResponse>.Success(ToAuthResponse(user, tokenService.GenerateToken(user)));
    }

    public async Task<ServiceResult<AuthResponse>> CreateStaffAsync(RegisterRequest request)
    {
        var error = ValidateRegisterInput(request.Username, request.Password, checkPasswordLength: true);
        if (error is not null) return ServiceResult<AuthResponse>.BadRequest(error);

        if (await db.Users.AnyAsync(u => u.Username == request.Username.Trim()))
        {
            return ServiceResult<AuthResponse>.BadRequest("Tên đăng nhập đã tồn tại.");
        }

        var user = CreateUser(request, "Staff");
        db.Users.Add(user);
        await db.SaveChangesAsync();

        return ServiceResult<AuthResponse>.Success(ToAuthResponse(user, ""));
    }

    public async Task<ServiceResult<AuthResponse>> MeAsync(string? username)
    {
        if (string.IsNullOrWhiteSpace(username))
        {
            return ServiceResult<AuthResponse>.BadRequest("Unauthorized");
        }

        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);
        return user is null
            ? ServiceResult<AuthResponse>.BadRequest("Unauthorized")
            : ServiceResult<AuthResponse>.Success(ToAuthResponse(user, ""));
    }

    private User CreateUser(RegisterRequest request, string role)
    {
        return new User
        {
            Username = request.Username.Trim(),
            PasswordHash = passwordService.Hash(request.Password),
            FullName = request.FullName?.Trim() ?? request.Username.Trim(),
            Role = role
        };
    }

    private static AuthResponse ToAuthResponse(User user, string token)
    {
        return new AuthResponse(token, user.Username, user.FullName, user.Role);
    }

    private static string? ValidateRegisterInput(string username, string password, bool checkPasswordLength)
    {
        if (string.IsNullOrWhiteSpace(username) || string.IsNullOrWhiteSpace(password))
        {
            return "Vui lòng nhập đầy đủ thông tin.";
        }

        if (checkPasswordLength && password.Length < 4)
        {
            return "Mật khẩu phải có ít nhất 4 ký tự.";
        }

        return null;
    }
}
