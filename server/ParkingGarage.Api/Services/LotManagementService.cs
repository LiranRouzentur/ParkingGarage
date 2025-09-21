using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Data;
using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.Interfaces;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Services;

/// <summary>
/// Service for managing parking lot operations with retry logic for concurrency
/// </summary>
public static class LotManagementService
{
    private const int MaxRetryAttempts = 3;
    private const int RetryDelayMs = 50;

    /// <summary>
    /// Find and reserve an available lot with retry logic for concurrency
    /// </summary>
    public static async Task<(bool IsValid, int LotNumber)> FindAndReserveLotAsync(
        TicketType ticketType,
        ParkingGarageDbContext context,
        ILoggingService loggingService)
    {
        try
        {
            loggingService.LogLotReservation("Starting lot reservation for ticket type {TicketType}", ticketType);

            for (int attempt = 0; attempt < MaxRetryAttempts; attempt++)
            {
                loggingService.LogLotReservation("Attempt {Attempt}/{MaxAttempts}", attempt + 1, MaxRetryAttempts);

                var availableLots = await context.ParkingLots
                    .Where(l => l.TicketType == ticketType && l.Status == LotStatus.Available)
                    .OrderBy(l => l.LotNumber)
                    .ToListAsync();

                loggingService.LogLotReservation("Found {Count} available lots for ticket type {TicketType}", availableLots.Count, ticketType);

                if (!availableLots.Any())
                {
                    loggingService.LogWarning("No available lots found for ticket type {TicketType}", ticketType);
                    return (false, 0);
                }

                // Select random lot to reduce conflicts
                var random = new Random();
                var selectedLot = availableLots[random.Next(availableLots.Count)];
                loggingService.LogLotReservation("Selected lot {LotNumber} (ID: {Id}) for reservation", selectedLot.LotNumber, selectedLot.Id);

                try
                {
                    // Use atomic update to reserve the lot
                    var rowsAffected = await context.Database.ExecuteSqlRawAsync(
                        "UPDATE ParkingLots SET Status = @status WHERE Id = @id AND Status = @availableStatus",
                        new Microsoft.Data.SqlClient.SqlParameter("@status", (int)LotStatus.Occupied),
                        new Microsoft.Data.SqlClient.SqlParameter("@id", selectedLot.Id),
                        new Microsoft.Data.SqlClient.SqlParameter("@availableStatus", (int)LotStatus.Available)
                    );

                    loggingService.LogLotReservation("Reservation attempt for lot {LotNumber}: {RowsAffected} rows affected", selectedLot.LotNumber, rowsAffected);

                    if (rowsAffected > 0)
                    {
                        loggingService.LogLotReservation("SUCCESS - Reserved lot {LotNumber}", selectedLot.LotNumber);
                        return (true, selectedLot.LotNumber);
                    }
                    else
                    {
                        loggingService.LogWarning("FAILED - Lot {LotNumber} may have been taken by another process", selectedLot.LotNumber);
                    }
                }
                catch (Exception ex)
                {
                    loggingService.LogError(ex, "ERROR reserving lot {LotNumber}: {Message}", selectedLot.LotNumber, ex.Message);
                }

                // Small delay before retry
                loggingService.LogLotReservation("Waiting {DelayMs}ms before retry...", RetryDelayMs);
                await Task.Delay(RetryDelayMs);
            }

            loggingService.LogError("FAILED to reserve any lot for ticket type {TicketType} after {MaxAttempts} attempts", ticketType, MaxRetryAttempts);
            return (false, 0);
        }
        catch (Exception ex)
        {
            loggingService.LogError(ex, "Error in FindAndReserveLotAsync for ticket type {TicketType}", ticketType);
            return (false, 0);
        }
    }

    /// <summary>
    /// Assign a vehicle to a reserved lot
    /// </summary>
    public static async Task AssignVehicleToLotAsync(int vehicleId, int lotNumber, ParkingGarageDbContext context, ILoggingService loggingService)
    {
        try
        {
            loggingService.LogVehicleProcessing("Assigning vehicle {VehicleId} to lot {LotNumber}", vehicleId, lotNumber);

            var lot = await context.ParkingLots
                .FirstOrDefaultAsync(l => l.LotNumber == lotNumber);

            if (lot == null)
            {
                loggingService.LogError("Lot {LotNumber} not found!", lotNumber);
                return;
            }

            loggingService.LogVehicleProcessing("Found lot {LotNumber} (ID: {Id}) with status {Status} and vehicle ID {VehicleId}",
                lotNumber, lot.Id, lot.Status, lot.VehicleId?.ToString() ?? "None");

            // If the lot is reserved but doesn't have a vehicle ID yet, just set the vehicle ID
            if (lot.Status == LotStatus.Occupied && lot.VehicleId == null)
            {
                loggingService.LogVehicleProcessing("Lot is occupied but has no vehicle ID, setting vehicle ID to {VehicleId}", vehicleId);
                lot.SetVehicleId(vehicleId);
            }
            else if (lot.Status == LotStatus.Available)
            {
                loggingService.LogVehicleProcessing("Lot is available, assigning vehicle {VehicleId}", vehicleId);
                lot.AssignVehicle(vehicleId);
            }
            else if (lot.Status == LotStatus.Occupied && lot.VehicleId != null)
            {
                loggingService.LogError("Lot {LotNumber} is already occupied by vehicle {ExistingVehicleId}!", lotNumber, lot.VehicleId);
                return;
            }
            else
            {
                loggingService.LogWarning("Unexpected lot status {Status} for lot {LotNumber}", lot.Status, lotNumber);
            }

            loggingService.LogVehicleProcessing("Saving changes...");
            await context.SaveChangesAsync();
            loggingService.LogVehicleProcessing("SUCCESS - Vehicle {VehicleId} assigned to lot {LotNumber}", vehicleId, lotNumber);
        }
        catch (Exception ex)
        {
            loggingService.LogError(ex, "Error assigning vehicle {VehicleId} to lot {LotNumber}", vehicleId, lotNumber);
        }
    }

    /// <summary>
    /// Get available ticket types with their lot counts
    /// </summary>
    public static async Task<List<(TicketType TicketType, int AvailableLots)>> GetAvailableTicketTypesWithCountsAsync(
        ParkingGarageDbContext context,
        ILoggingService loggingService)
    {
        var availableTicketTypesWithCounts = new List<(TicketType TicketType, int AvailableLots)>();

        var allTicketTypes = TicketTypeConfig.GetAllTicketTypes();

        foreach (var ticketType in allTicketTypes)
        {
            var availableLots = await context.ParkingLots
                .CountAsync(l => l.TicketType == ticketType.Type && l.Status == LotStatus.Available);

            loggingService.LogAsyncCheckIn("Ticket type {TicketType}: {AvailableLots} available lots",
                ticketType.Name, availableLots);

            if (availableLots > 0)
            {
                availableTicketTypesWithCounts.Add((ticketType.Type, availableLots));
            }
        }

        loggingService.LogAsyncCheckIn("Found {Count} ticket types with available lots",
            availableTicketTypesWithCounts.Count);

        return availableTicketTypesWithCounts;
    }
}
