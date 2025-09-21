using Microsoft.Extensions.Logging;

namespace ParkingGarage.Api.Interfaces;

public interface ILoggingService
{
    void LogInfo(string message, params object[] args);
    void LogWarning(string message, params object[] args);
    void LogError(string message, params object[] args);
    void LogError(Exception exception, string message, params object[] args);
    void LogDebug(string message, params object[] args);
    void LogAsyncCheckIn(string message, params object[] args);
    void LogVehicleGeneration(string message, params object[] args);
    void LogTicketTypeSelection(string message, params object[] args);
    void LogLotReservation(string message, params object[] args);
    void LogVehicleProcessing(string message, params object[] args);
}
