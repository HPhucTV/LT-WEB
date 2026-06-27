namespace TravelTour.Api.Services;

public class ServiceResult
{
    public bool IsSuccess { get; init; }
    public bool IsNotFound { get; init; }
    public bool IsForbidden { get; init; }
    public string? Error { get; init; }

    public static ServiceResult Success() => new() { IsSuccess = true };
    public static ServiceResult NotFound() => new() { IsNotFound = true };
    public static ServiceResult Forbidden(string error) => new() { IsForbidden = true, Error = error };
    public static ServiceResult BadRequest(string error) => new() { Error = error };
}

public class ServiceResult<T> : ServiceResult
{
    public T? Value { get; init; }

    public static ServiceResult<T> Success(T value) => new() { IsSuccess = true, Value = value };
    public new static ServiceResult<T> NotFound() => new() { IsNotFound = true };
    public new static ServiceResult<T> Forbidden(string error) => new() { IsForbidden = true, Error = error };
    public new static ServiceResult<T> BadRequest(string error) => new() { Error = error };
}
