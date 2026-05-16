using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TravelTour.Api.Contracts;
using TravelTour.Api.Services;

namespace TravelTour.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController(AuthService authService) : ControllerBase
{
    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginRequest request)
    {
        var result = await authService.LoginAsync(request);
        if (result.IsSuccess)
        {
            return Ok(result.Value);
        }

        return result.Error == "Tài khoản hoặc mật khẩu không đúng."
            ? Unauthorized(new { message = result.Error })
            : BadRequest(new { message = result.Error });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterRequest request)
    {
        var result = await authService.RegisterAsync(request);
        return result.IsSuccess ? Created("/api/auth/me", result.Value) : BadRequest(new { message = result.Error });
    }

    [Authorize(Roles = "Admin")]
    [HttpPost("create-staff")]
    public async Task<IActionResult> CreateStaff(RegisterRequest request)
    {
        var result = await authService.CreateStaffAsync(request);
        return result.IsSuccess ? Created("/api/auth/me", result.Value) : BadRequest(new { message = result.Error });
    }

    [Authorize]
    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var result = await authService.MeAsync(User.FindFirstValue(ClaimTypes.Name));
        return result.IsSuccess ? Ok(result.Value) : Unauthorized();
    }
}
