using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Data;
using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.Interfaces;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Services;

/// <summary>
/// Service for managing vehicle operations and validation
/// </summary>
public static class VehicleManagementService
{
    /// <summary>
    /// Create and save a parked vehicle
    /// </summary>
    public static async Task<(bool IsValid, int VehicleId)> CreateAndSaveVehicleAsync(
        CheckInRequest request,
        TicketType ticketType,
        int lotNumber,
        ParkingGarageDbContext context,
        ILoggingService loggingService)
    {
        try
        {
            loggingService.LogVehicleProcessing("Creating vehicle for {LicensePlate} in lot {LotNumber}", request.LicensePlate, lotNumber);

            var parkedVehicle = new ParkedVehicle(
                request.Name,
                LicensePlate.Create(request.LicensePlate),
                request.Phone,
                ticketType,
                request.VehicleType,
                request.Height,
                request.Width,
                request.Length,
                lotNumber
            );

            loggingService.LogVehicleProcessing("Created vehicle object with ID {VehicleId}", parkedVehicle.Id);
            loggingService.LogVehicleProcessing("Vehicle details - Name: {Name}, Phone: {Phone}, Type: {VehicleType}",
                parkedVehicle.Name, parkedVehicle.Phone, parkedVehicle.VehicleType);

            context.ParkedVehicles.Add(parkedVehicle);
            loggingService.LogVehicleProcessing("Added vehicle to context");

            await context.SaveChangesAsync();
            loggingService.LogVehicleProcessing("SUCCESS - Saved vehicle with ID {VehicleId}", parkedVehicle.Id);

            return (true, parkedVehicle.Id);
        }
        catch (Exception ex)
        {
            loggingService.LogError(ex, "ERROR creating vehicle: {Message}", ex.Message);
            return (false, 0);
        }
    }

    /// <summary>
    /// Validate that the check-in request is valid
    /// </summary>
    public static async Task<CheckInResult> ValidateCheckInRequestAsync(
        CheckInRequest request,
        ParkingGarageDbContext context,
        ILoggingService loggingService)
    {
        var existingVehicle = await context.ParkedVehicles
            .FirstOrDefaultAsync(v => v.LicensePlate.Value == request.LicensePlate && v.CheckOutTime == null);

        if (existingVehicle != null)
        {
            return new CheckInResult
            {
                Message = "Vehicle is already parked in the garage",
                LotNumber = 0,
                RequiresUpgrade = false,
                UpgradeCost = 0
            };
        }

        return new CheckInResult { LotNumber = -1 }; // Valid
    }

    /// <summary>
    /// Determine the appropriate ticket type and check for upgrades
    /// </summary>
    public static async Task<(bool IsValid, TicketType? TicketType, bool RequiresUpgrade, decimal UpgradeCost, string? UpgradeMessage)>
        DetermineTicketTypeAsync(
            CheckInRequest request,
            ParkingGarageDbContext context,
            IDbContextFactory<ParkingGarageDbContext> contextFactory,
            ILoggingService loggingService)
    {
        // First, check if the requested ticket type is suitable for this vehicle
        var requestedTicketType = TicketTypeConfig.GetConfig(request.TicketType);

        // Check if the requested ticket type is compatible with the vehicle
        bool isRequestedTicketTypeCompatible = requestedTicketType.IsVehicleCompatible(
            request.VehicleType, request.Height, request.Width, request.Length);

        if (isRequestedTicketTypeCompatible)
        {
            // The requested ticket type is suitable - use it without upgrade
            return (true, (TicketType?)request.TicketType, false, 0m, (string?)null);
        }

        // The requested ticket type is not suitable - find a suitable upgrade option
        var suitableTicketType = TicketTypeConfig.FindSuitableTicketType(
            request.VehicleType, request.Height, request.Width, request.Length);

        loggingService.LogWarning("Suitable ticket type found: {TicketType} for vehicle {VehicleType} with dimensions {Height}x{Width}x{Length}",
            suitableTicketType?.Type.ToString() ?? "None", request.VehicleType, request.Height, request.Width, request.Length);

        if (suitableTicketType == null)
        {
            loggingService.LogWarning("No suitable ticket type found for vehicle {VehicleType} with dimensions {Height}x{Width}x{Length}",
                request.VehicleType, request.Height, request.Width, request.Length);
            return (false, (TicketType?)null, false, 0m, (string?)null);
        }

        // Check if the suggested upgrade ticket type has available lots
        using var checkContext = await contextFactory.CreateDbContextAsync();
        var availableLots = await checkContext.ParkingLots
            .Where(l => l.TicketType == suitableTicketType.Type && l.Status == LotStatus.Available)
            .CountAsync();

        if (availableLots == 0)
        {
            // No available lots for the upgrade option
            var noLotsMessage = $"Your vehicle doesn't meet the criteria for {requestedTicketType.Name} ticket. " +
                              "And unfortunately the relevant lots are completely full.";
            return (false, (TicketType?)null, false, 0m, noLotsMessage);
        }

        // Calculate upgrade cost and create upgrade message
        var upgradeCost = suitableTicketType.GetUpgradeCost(request.TicketType);

        var upgradeMessage = $"Your vehicle doesn't meet the criteria for {requestedTicketType.Name} ticket. " +
                           $"You can upgrade to {suitableTicketType.Name} ticket for an additional ${upgradeCost:F2}.";

        return (false, (TicketType?)suitableTicketType.Type, true, upgradeCost, upgradeMessage);
    }

    /// <summary>
    /// Calculate cost based on time parked
    /// </summary>
    public static decimal CalculateCost(TimeSpan timeParked, TicketTypeInfo config)
    {
        var hours = (decimal)timeParked.TotalHours;
        return hours * config.Cost;
    }
}
