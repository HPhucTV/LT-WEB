using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using TravelTour.Api.Data;
using TravelTour.Api.Options;
using TravelTour.Api.Repositories;
using TravelTour.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.ClearProviders();
builder.Logging.AddConsole();
builder.Logging.AddDebug();

// ─── Database ───────────────────────────────────────────────────────────────

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// ─── Redis Cache ────────────────────────────────────────────────────────────

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
{
    var redisOptions = ConfigurationOptions.Parse(builder.Configuration["Redis"]!);
    redisOptions.AbortOnConnectFail = false;
    return ConnectionMultiplexer.Connect(redisOptions);
});
builder.Services.AddSingleton<CacheService>();

// ─── Application Services ───────────────────────────────────────────────────

builder.Services.AddSingleton<TokenService>();
builder.Services.AddSingleton<PasswordService>();
builder.Services.Configure<VnpayOptions>(builder.Configuration.GetSection("Vnpay"));
builder.Services.AddSingleton<VnpayPaymentService>();
builder.Services.AddScoped<ITourRepository, TourRepository>();
builder.Services.AddScoped<IScheduleRepository, ScheduleRepository>();
builder.Services.AddScoped<IBookingRepository, BookingRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<TourService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<BookingService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<CustomerService>();
builder.Services.AddScoped<GuideAvailabilityService>();
builder.Services.AddScoped<PaymentService>();
builder.Services.AddScoped<ReportService>();
builder.Services.AddScoped<ReviewService>();
builder.Services.AddScoped<UserManagementService>();

// ─── Authentication & Authorization ─────────────────────────────────────────

builder.Services.AddCors(options =>
{
    options.AddPolicy("ReactClient", policy =>
        policy.WithOrigins("http://localhost:5173")
            .AllowAnyHeader()
            .AllowAnyMethod());
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddOpenApi();

// ─── Build & Middleware ─────────────────────────────────────────────────────

var app = builder.Build();

await DataSeeder.SeedAsync(app.Services);

// Global exception handler — prevents stack traces from leaking to clients
app.UseExceptionHandler(errorApp =>
{
    errorApp.Run(async context =>
    {
        context.Response.StatusCode = 500;
        context.Response.ContentType = "application/json";
        await context.Response.WriteAsJsonAsync(new { message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau." });
    });
});

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();
app.UseCors("ReactClient");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
