using System.Text.Json;
using Microsoft.Extensions.Logging;
using StackExchange.Redis;

namespace TravelTour.Api.Services;

/// <summary>
/// Thin wrapper for Redis string cache with JSON serialization.
/// Uses ILogger instead of Console.WriteLine for structured logging.
/// </summary>
public class CacheService(IConnectionMultiplexer redis, ILogger<CacheService> logger)
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        var json = await _db.StringGetAsync(key);

        if (json.IsNullOrEmpty)
        {
            logger.LogDebug("[Redis MISS] Key '{Key}' không có trong cache", key);
            return null;
        }

        logger.LogDebug("[Redis HIT] Key '{Key}' lấy từ cache", key);
        return JsonSerializer.Deserialize<T>((string)json!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var json = JsonSerializer.Serialize(value);
        var ttl = expiry ?? TimeSpan.FromMinutes(5);
        await _db.StringSetAsync(key, json, ttl);
        logger.LogDebug("[Redis SET] Key '{Key}' đã lưu vào cache (TTL: {Minutes} phút)", key, ttl.TotalMinutes);
    }

    public async Task RemoveAsync(string key)
    {
        await _db.KeyDeleteAsync(key);
        logger.LogDebug("[Redis DEL] Key '{Key}' đã xóa khỏi cache", key);
    }
}
