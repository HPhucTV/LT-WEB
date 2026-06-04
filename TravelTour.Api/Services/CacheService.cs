using System.Text.Json;
using StackExchange.Redis;

namespace TravelTour.Api.Services;

public class CacheService(IConnectionMultiplexer redis, ILogger<CacheService> logger)
{
    private readonly IDatabase _db = redis.GetDatabase();

    public async Task<T?> GetAsync<T>(string key) where T : class
    {
        RedisValue json;
        try
        {
            json = await _db.StringGetAsync(key);
        }
        catch (RedisException ex)
        {
            logger.LogWarning(ex, "[Redis SKIP] Cannot read cache key '{Key}'", key);
            return null;
        }

        if (json.IsNullOrEmpty)
        {
            logger.LogDebug("[Redis MISS] Key '{Key}' not found", key);
            return null;
        }

        logger.LogDebug("[Redis HIT] Key '{Key}' loaded from cache", key);
        return JsonSerializer.Deserialize<T>((string)json!);
    }

    public async Task SetAsync<T>(string key, T value, TimeSpan? expiry = null)
    {
        var json = JsonSerializer.Serialize(value);
        var ttl = expiry ?? TimeSpan.FromMinutes(5);
        try
        {
            await _db.StringSetAsync(key, json, ttl);
            logger.LogDebug("[Redis SET] Key '{Key}' cached for {Minutes} minutes", key, ttl.TotalMinutes);
        }
        catch (RedisException ex)
        {
            logger.LogWarning(ex, "[Redis SKIP] Cannot write cache key '{Key}'", key);
        }
    }

    public async Task RemoveAsync(string key)
    {
        try
        {
            await _db.KeyDeleteAsync(key);
            logger.LogDebug("[Redis DEL] Key '{Key}' removed", key);
        }
        catch (RedisException ex)
        {
            logger.LogWarning(ex, "[Redis SKIP] Cannot remove cache key '{Key}'", key);
        }
    }
}
