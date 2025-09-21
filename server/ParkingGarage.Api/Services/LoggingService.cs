using Microsoft.Extensions.Logging;
using ParkingGarage.Api.Interfaces;

namespace ParkingGarage.Api.Services;

public class LoggingService : ILoggingService
{
    private readonly ILogger<LoggingService> _logger;

    public LoggingService(ILogger<LoggingService> logger)
    {
        _logger = logger;
    }

    public void LogInfo(string message, params object[] args)
    {
        _logger.LogInformation(message, args);
    }

    public void LogWarning(string message, params object[] args)
    {
        _logger.LogWarning(message, args);
    }

    public void LogError(string message, params object[] args)
    {
        _logger.LogError(message, args);
    }

    public void LogError(Exception exception, string message, params object[] args)
    {
        _logger.LogError(exception, message, args);
    }

    public void LogDebug(string message, params object[] args)
    {
        _logger.LogDebug(message, args);
    }

    public void LogAsyncCheckIn(string message, params object[] args)
    {
        _logger.LogInformation("[ASYNC_CHECKIN] {Message}", message);
    }

    public void LogVehicleGeneration(string message, params object[] args)
    {
        _logger.LogInformation("[VEHICLE_GENERATION] {Message}", message);
    }

    public void LogTicketTypeSelection(string message, params object[] args)
    {
        _logger.LogInformation("[TICKET_TYPE_SELECTION] {Message}", message);
    }

    public void LogLotReservation(string message, params object[] args)
    {
        _logger.LogInformation("[LOT_RESERVATION] {Message}", message);
    }

    public void LogVehicleProcessing(string message, params object[] args)
    {
        _logger.LogInformation("[VEHICLE_PROCESSING] {Message}", message);
    }
}
