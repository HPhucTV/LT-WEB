using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TravelTour.Api.Contracts;
using TravelTour.Api.Data;
using TravelTour.Api.Models;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AppDbContext db, TokenService tokenService, PasswordService passwordService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin." });

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == request.Username.Trim());

        if (user is null || !passwordService.Verify(request.Password, user.PasswordHash))
            return Unauthorized(new { message = "Tài khoản hoặc mật khẩu không đúng." });

        var token = tokenService.GenerateToken(user);
        return Ok(new AuthResponse(token, user.Username, user.FullName, user.Role));
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin." });

        if (request.Password.Length < 4)
            return BadRequest(new { message = "Mật khẩu phải có ít nhất 4 ký tự." });

        var exists = await db.Users.AnyAsync(u => u.Username == request.Username.Trim());
        if (exists)
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại." });

        var isFirstUser = !await db.Users.AnyAsync();

        // First user → Admin. Public registration → Customer only.
        var role = isFirstUser ? "Admin" : "Customer";

        var user = new User
        {
            Username = request.Username.Trim(),
            PasswordHash = passwordService.Hash(request.Password),
            FullName = request.FullName?.Trim() ?? request.Username.Trim(),
            Role = role
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        var token = tokenService.GenerateToken(user);
        return Created("/api/auth/me", new AuthResponse(token, user.Username, user.FullName, user.Role));
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("create-staff")]
    public async Task<IActionResult> CreateStaff(RegisterRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
            return BadRequest(new { message = "Vui lòng nhập đầy đủ thông tin." });

        if (request.Password.Length < 4)
            return BadRequest(new { message = "Mật khẩu phải có ít nhất 4 ký tự." });

        var exists = await db.Users.AnyAsync(u => u.Username == request.Username.Trim());
        if (exists)
            return BadRequest(new { message = "Tên đăng nhập đã tồn tại." });

        var user = new User
        {
            Username = request.Username.Trim(),
            PasswordHash = passwordService.Hash(request.Password),
            FullName = request.FullName?.Trim() ?? request.Username.Trim(),
            Role = "Staff"
        };

        db.Users.Add(user);
        await db.SaveChangesAsync();

        return Created("/api/auth/me", new AuthResponse("", user.Username, user.FullName, user.Role));
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var username = User.FindFirstValue(ClaimTypes.Name);
        var user = await db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Username == username);

        return user is null
            ? Unauthorized()
            : Ok(new AuthResponse("", user.Username, user.FullName, user.Role));
    }
}
