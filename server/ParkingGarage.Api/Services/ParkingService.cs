using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Interfaces;
using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;
using ParkingGarage.Api.Data;
using ParkingGarage.Api.Models;
using ParkingGarage.Api.Services;

namespace ParkingGarage.Api.Services;

/// <summary>
/// ParkingService manages vehicle check-in/check-out operations
/// Implements PRD requirements for vehicle check-in/check-out operations
/// </summary>
public class ParkingService : IParkingService
{
    private readonly ParkingGarageDbContext _context;
    private readonly IDbContextFactory<ParkingGarageDbContext> _contextFactory;
    private readonly ILoggingService _loggingService;

    // Constants for better maintainability
    private const int AsyncCheckInCount = 5;

    public ParkingService(ParkingGarageDbContext context, IDbContextFactory<ParkingGarageDbContext> contextFactory, ILoggingService loggingService)
    {
        _context = context;
        _contextFactory = contextFactory;
        _loggingService = loggingService;
    }

    // Check in a single vehicle (manual or generated data)
    public async Task<CheckInResult> CheckInVehicleAsync(CheckInRequest request)
    {
        var results = await ProcessVehiclesAsync(new[] { request }, _context);
        return results.First();
    }

    // Check in multiple random vehicles (5 vehicles on demand)
    public async Task<AsyncCheckInResult> AsyncCheckInVehiclesAsync(int? requestedCount = null)
    {
        try
        {
            // Use requested count or default to AsyncCheckInCount, but limit to available lots
            var availableTicketTypesWithCounts = await LotManagementService.GetAvailableTicketTypesWithCountsAsync(_context, _loggingService);
            var totalAvailableLots = availableTicketTypesWithCounts.Sum(x => x.AvailableLots);
            var actualCount = requestedCount.HasValue
                ? Math.Min(requestedCount.Value, totalAvailableLots)
                : Math.Min(AsyncCheckInCount, totalAvailableLots);

            _loggingService.LogAsyncCheckIn("=== ASYNC CHECK-IN STARTED ===");
            _loggingService.LogAsyncCheckIn("Requesting {Count} vehicles to be checked in (Available: {AvailableLots})", actualCount, totalAvailableLots);

            if (totalAvailableLots == 0)
            {
                _loggingService.LogWarning("No available lots found! Cannot check in any vehicles.");
                return CreateNoLotsAvailableResult();
            }

            var requests = await GenerateRandomCheckInRequestsAsync(actualCount);
            _loggingService.LogAsyncCheckIn("Generated {Count} total requests", requests.Length);

            // Filter out empty requests
            var validRequests = requests.Where(r => !string.IsNullOrEmpty(r.LicensePlate)).ToArray();
            _loggingService.LogAsyncCheckIn("Valid requests: {ValidCount} out of {TotalCount}", validRequests.Length, requests.Length);

            if (validRequests.Length == 0)
            {
                _loggingService.LogWarning("No valid requests generated! This will cause all check-ins to fail.");
            }

            _loggingService.LogAsyncCheckIn("=== PROCESSING VEHICLES ===");
            var results = await ProcessVehiclesAsync(validRequests, null); // Use factory for concurrent operations
            _loggingService.LogAsyncCheckIn("Processed {Count} vehicles", results.Length);

            var successful = results.Count(r => r.LotNumber > 0);
            var failed = results.Count(r => r.LotNumber == 0);
            _loggingService.LogAsyncCheckIn("Results: {Successful} successful, {Failed} failed", successful, failed);

            _loggingService.LogAsyncCheckIn("=== ASYNC CHECK-IN COMPLETED ===");
            return new AsyncCheckInResult
            {
                Results = results.Select(r => new AsyncCheckInItem
                {
                    LicensePlate = r.LicensePlate,
                    Name = r.Name,
                    Phone = r.Phone,
                    TicketType = r.TicketType,
                    VehicleType = r.VehicleType,
                    Height = r.Height,
                    Width = r.Width,
                    Length = r.Length,
                    Success = r.LotNumber > 0,
                    Message = r.Message,
                    LotNumber = r.LotNumber
                }).ToList(),
                TotalProcessed = results.Length,
                Successful = successful,
                Failed = failed
            };
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error in AsyncCheckInVehiclesAsync");
            throw;
        }
    }

    public async Task<CheckOutResult> CheckOutVehicleAsync(CheckOutRequest request)
    {
        // First validate that the lot number and license plate match
        var lot = await _context.ParkingLots
            .Include(l => l.Vehicle)
            .FirstOrDefaultAsync(l => l.LotNumber == request.LotNumber);

        if (lot == null)
        {
            throw new InvalidOperationException("Parking lot not found");
        }

        if (lot.Status != LotStatus.Occupied || lot.Vehicle == null)
        {
            throw new InvalidOperationException("No vehicle is currently parked in this lot");
        }

        if (lot.Vehicle.LicensePlate.Value != request.LicensePlate)
        {
            throw new InvalidOperationException("License plate does not match the vehicle in this lot");
        }

        var vehicle = lot.Vehicle;

        // Calculate total cost based on time parked
        var timeParked = DateTime.UtcNow - vehicle.CheckInTime;
        var ticketConfig = TicketTypeConfig.GetConfig(vehicle.TicketType);
        var totalCost = VehicleManagementService.CalculateCost(timeParked, ticketConfig);

        // Check out vehicle
        vehicle.CheckOut(totalCost);
        lot.ReleaseVehicle();

        await _context.SaveChangesAsync();

        return new CheckOutResult
        {
            VehicleName = vehicle.Name,
            LotNumber = vehicle.LotNumber,
            CheckInTime = vehicle.CheckInTime,
            CheckOutTime = vehicle.CheckOutTime!.Value,
            TotalCost = totalCost
        };
    }

    public async Task<List<ParkingLot>> GetGarageStateAsync(int? ticketTypeFilter = null, int? statusFilter = null)
    {
        try
        {
            _loggingService.LogInfo("Getting garage state with filters - TicketType: {TicketType}, Status: {Status}",
                ticketTypeFilter?.ToString() ?? "All", statusFilter?.ToString() ?? "All");

            // If no filters, use the original method for better performance
            if (ticketTypeFilter == null && statusFilter == null)
            {
                return await _context.ParkingLots
                    .Include(l => l.Vehicle)
                    .OrderBy(l => l.LotNumber)
                    .ToListAsync();
            }

            // Use stored procedure for filtered results
            var results = await _context.Database.SqlQueryRaw<GarageStateDto>(
                "EXEC GetGarageStateWithFilters @TicketTypeFilter, @StatusFilter",
                new Microsoft.Data.SqlClient.SqlParameter("@TicketTypeFilter", ticketTypeFilter ?? (object)DBNull.Value),
                new Microsoft.Data.SqlClient.SqlParameter("@StatusFilter", statusFilter ?? (object)DBNull.Value)
            ).ToListAsync();

            return ConvertDtoResultsToParkingLots(results);
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting garage state with filters");
            throw;
        }
    }

    public async Task<List<ParkedVehicle>> GetVehiclesByTicketTypeAsync(TicketType ticketType)
    {
        // Use a direct query to get vehicles by ticket type since the stored procedure returns lot data too
        return await _context.ParkedVehicles
            .Where(v => v.TicketType == ticketType && v.CheckOutTime == null)
            .OrderByDescending(v => v.CheckInTime)
            .ToListAsync();
    }

    public async Task<CheckInRequest> GenerateRandomDataAsync()
    {
        try
        {
            _loggingService.LogVehicleGeneration("=== GENERATING RANDOM DATA ===");

            // Get available ticket types with their available lot counts
            var availableTicketTypesWithCounts = await LotManagementService.GetAvailableTicketTypesWithCountsAsync(_context, _loggingService);
            var totalAvailableLots = availableTicketTypesWithCounts.Sum(x => x.AvailableLots);

            _loggingService.LogVehicleGeneration("Available ticket types with counts: {TicketTypes}",
                string.Join(", ", availableTicketTypesWithCounts.Select(x => $"{x.TicketType}({x.AvailableLots})")));

            if (totalAvailableLots == 0)
            {
                _loggingService.LogWarning("No available lots found! Cannot generate random data.");
                return CreateNoAvailableLotsRequest();
            }

            // Generate a single random request using the same logic as random check-in
            var requests = await GenerateRandomCheckInRequestsAsync(1);
            _loggingService.LogVehicleGeneration("Generated random data: {LicensePlate} for {TicketType} ticket",
                requests[0].LicensePlate, requests[0].TicketType);

            return requests[0];
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error in GenerateRandomDataAsync");
            throw;
        }
    }

    public async Task<CheckInResult> CheckInVehicleWithUpgradeAsync(CheckInRequest request)
    {
        try
        {
            _loggingService.LogVehicleProcessing("=== CHECK-IN WITH UPGRADE STARTED ===");
            _loggingService.LogVehicleProcessing("Processing {LicensePlate} with upgrade", request.LicensePlate);

            using var context = _contextFactory.CreateDbContext();
            using var transaction = await context.Database.BeginTransactionAsync();

            try
            {
                // Validate the request
                var validationResult = await VehicleManagementService.ValidateCheckInRequestAsync(request, context, _loggingService);
                if (validationResult.LotNumber != -1)
                {
                    _loggingService.LogWarning("Validation failed for {LicensePlate}: {Message}", request.LicensePlate, validationResult.Message);
                    return validationResult;
                }

                // Find a suitable ticket type for the vehicle
                var suitableTicketType = TicketTypeConfig.FindSuitableTicketType(request.VehicleType, request.Height, request.Width, request.Length);
                if (suitableTicketType == null)
                {
                    _loggingService.LogWarning("No suitable ticket type found for {LicensePlate}", request.LicensePlate);
                    return CreateNoSuitableTicketResult();
                }

                _loggingService.LogVehicleProcessing("Using upgraded ticket type {TicketType} for {LicensePlate}", suitableTicketType, request.LicensePlate);

                // Find and reserve available lot
                var lotResult = await LotManagementService.FindAndReserveLotAsync(suitableTicketType.Type, context, _loggingService);
                if (!lotResult.IsValid)
                {
                    _loggingService.LogWarning("No available lots for ticket type {TicketType} for {LicensePlate}", suitableTicketType, request.LicensePlate);
                    return CreateNoAvailableLotsResult();
                }

                // Create and save vehicle
                var vehicleResult = await VehicleManagementService.CreateAndSaveVehicleAsync(request, suitableTicketType.Type, lotResult.LotNumber, context, _loggingService);
                if (!vehicleResult.IsValid)
                {
                    _loggingService.LogError("Failed to create vehicle for {LicensePlate}", request.LicensePlate);
                    return CreateVehicleCreationFailedResult();
                }

                // Assign vehicle to lot
                await LotManagementService.AssignVehicleToLotAsync(vehicleResult.VehicleId, lotResult.LotNumber, context, _loggingService);

                await context.SaveChangesAsync();
                await transaction.CommitAsync();

                _loggingService.LogVehicleProcessing("SUCCESS - {LicensePlate} checked in with upgrade to {TicketType} in lot {LotNumber}",
                    request.LicensePlate, suitableTicketType, lotResult.LotNumber);

                return CreateSuccessResult(request, suitableTicketType.Type, lotResult.LotNumber, true);
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                _loggingService.LogError(ex, "Error during check-in with upgrade for {LicensePlate}", request.LicensePlate);
                throw;
            }
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error in CheckInVehicleWithUpgradeAsync");
            throw;
        }
    }

    #region Private Helper Methods

    /// <summary>
    /// Unified method to process multiple vehicles (single or multiple)
    /// </summary>
    private async Task<CheckInResult[]> ProcessVehiclesAsync(CheckInRequest[] requests, ParkingGarageDbContext? context)
    {
        try
        {
            _loggingService.LogVehicleProcessing("Processing {Count} vehicles", requests.Length);
            _loggingService.LogVehicleProcessing("Context provided: {HasContext}", context != null);

            if (requests.Length == 1 && context != null)
            {
                _loggingService.LogVehicleProcessing("Single vehicle processing with existing context");
                // Single vehicle - use existing context
                var result = await ProcessSingleVehicleAsync(requests[0], context);
                return new[] { result };
            }
            else
            {
                _loggingService.LogVehicleProcessing("Multiple vehicle processing with factory contexts");
                // Multiple vehicles - use factory for concurrent operations
                var tasks = requests.Select(async (request, index) =>
            {
                _loggingService.LogVehicleProcessing("Starting task {TaskNumber} for vehicle {LicensePlate}", index + 1, request.LicensePlate);
                using var dbContext = await _contextFactory.CreateDbContextAsync();
                var result = await ProcessSingleVehicleAsync(request, dbContext);
                _loggingService.LogVehicleProcessing("Completed task {TaskNumber} for vehicle {LicensePlate} - Success: {Success}", index + 1, request.LicensePlate, result.LotNumber > 0);
                return result;
            });

                _loggingService.LogVehicleProcessing("Waiting for all tasks to complete...");
                var results = await Task.WhenAll(tasks);
                _loggingService.LogVehicleProcessing("All {Count} tasks completed", results.Length);
                return results;
            }
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error in ProcessVehiclesAsync");
            throw;
        }
    }

    /// <summary>
    /// Process a single vehicle check-in
    /// </summary>
    private async Task<CheckInResult> ProcessSingleVehicleAsync(CheckInRequest request, ParkingGarageDbContext context)
    {
        try
        {
            _loggingService.LogVehicleProcessing("Processing vehicle: {LicensePlate} (TicketType: {TicketType}, VehicleType: {VehicleType})",
                request.LicensePlate, request.TicketType, request.VehicleType);

            // Validate vehicle not already parked
            var validationResult = await VehicleManagementService.ValidateCheckInRequestAsync(request, context, _loggingService);
            if (validationResult.LotNumber == 0) // Error case
            {
                _loggingService.LogWarning("Validation failed for {LicensePlate}: {Message}", request.LicensePlate, validationResult.Message);
                return validationResult;
            }

            // Determine suitable ticket type and check for upgrades
            var ticketTypeResult = await VehicleManagementService.DetermineTicketTypeAsync(request, context, _contextFactory, _loggingService);
            if (!ticketTypeResult.IsValid)
            {
                if (ticketTypeResult.RequiresUpgrade && ticketTypeResult.UpgradeMessage != null)
                {
                    // Vehicle doesn't meet criteria for requested ticket type - return upgrade option
                    _loggingService.LogWarning("Vehicle {LicensePlate} doesn't meet criteria for requested ticket type. Upgrade required.", request.LicensePlate);
                    return new CheckInResult
                    {
                        Message = ticketTypeResult.UpgradeMessage,
                        LotNumber = 0,
                        RequiresUpgrade = true,
                        UpgradeCost = ticketTypeResult.UpgradeCost,
                        SuggestedTicketType = ticketTypeResult.TicketType
                    };
                }
                else
                {
                    // No suitable ticket type found at all
                    _loggingService.LogWarning("No suitable ticket type found for {LicensePlate}", request.LicensePlate);
                    return CreateNoSuitableTicketResult();
                }
            }

            _loggingService.LogVehicleProcessing("Determined ticket type for {LicensePlate}: {TicketType} (Upgrade: {RequiresUpgrade})",
                request.LicensePlate, ticketTypeResult.TicketType?.ToString() ?? "Unknown", ticketTypeResult.RequiresUpgrade);

            // Find and reserve available lot
            var lotResult = await LotManagementService.FindAndReserveLotAsync(ticketTypeResult.TicketType!.Value, context, _loggingService);
            if (!lotResult.IsValid)
            {
                _loggingService.LogWarning("No available lots for ticket type {TicketType} for {LicensePlate}", ticketTypeResult.TicketType, request.LicensePlate);
                return CreateNoAvailableLotsResult();
            }

            _loggingService.LogVehicleProcessing("Reserved lot {LotNumber} for {LicensePlate}", lotResult.LotNumber, request.LicensePlate);

            // Create and save vehicle
            var vehicleResult = await VehicleManagementService.CreateAndSaveVehicleAsync(request, ticketTypeResult.TicketType.Value, lotResult.LotNumber, context, _loggingService);
            if (!vehicleResult.IsValid)
            {
                _loggingService.LogError("Failed to create vehicle for {LicensePlate}", request.LicensePlate);
                return CreateVehicleCreationFailedResult();
            }

            // Assign vehicle to lot
            await LotManagementService.AssignVehicleToLotAsync(vehicleResult.VehicleId, lotResult.LotNumber, context, _loggingService);

            _loggingService.LogVehicleProcessing("Successfully processed {LicensePlate} in lot {LotNumber}", request.LicensePlate, lotResult.LotNumber);

            return CreateSuccessResult(request, ticketTypeResult.TicketType.Value, lotResult.LotNumber, ticketTypeResult.RequiresUpgrade);
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error processing vehicle {LicensePlate}", request.LicensePlate);
            throw;
        }
    }

    /// <summary>
    /// Generate multiple random check-in requests with professional business logic
    /// </summary>
    private async Task<CheckInRequest[]> GenerateRandomCheckInRequestsAsync(int count)
    {
        try
        {
            _loggingService.LogVehicleGeneration("=== GENERATING {Count} RANDOM VEHICLES ===", count);
            var requests = new List<CheckInRequest>();
            var usedLicensePlates = new HashSet<string>();

            // Get initial available ticket types with their available lot counts
            _loggingService.LogVehicleGeneration("Getting initial available ticket types...");
            var availableTicketTypesWithCounts = await LotManagementService.GetAvailableTicketTypesWithCountsAsync(_context, _loggingService);

            _loggingService.LogVehicleGeneration("Initial available ticket types with counts: {TicketTypes}",
                string.Join(", ", availableTicketTypesWithCounts.Select(x => $"{x.TicketType}({x.AvailableLots})")));

            if (!availableTicketTypesWithCounts.Any())
            {
                _loggingService.LogError("No available ticket types found! This will cause all check-ins to fail.");
                return new CheckInRequest[0]; // Return empty array if no lots available
            }

            // Create a working copy of available lots that we can modify during generation
            var workingAvailability = new Dictionary<TicketType, int>();
            foreach (var (ticketType, availableLots) in availableTicketTypesWithCounts)
            {
                workingAvailability[ticketType] = availableLots;
            }

            _loggingService.LogVehicleGeneration("Starting intelligent generation of {Count} vehicles...", count);

            for (int i = 0; i < count; i++)
            {
                _loggingService.LogVehicleGeneration("--- Generating vehicle {Current}/{Total} ---", i + 1, count);

                // Check if we still have available lots
                var currentAvailableTypes = workingAvailability
                    .Where(kvp => kvp.Value > 0)
                    .Select(kvp => (kvp.Key, kvp.Value))
                    .ToList();

                _loggingService.LogVehicleGeneration("Current available ticket types with counts: {TicketTypes}",
                    string.Join(", ", currentAvailableTypes.Select(x => $"{x.Key}({x.Value})")));

                if (!currentAvailableTypes.Any())
                {
                    _loggingService.LogWarning("No available ticket types found for vehicle {Current}. Stopping generation.", i + 1);
                    break; // Stop generating if no lots are available
                }

                // Generate unique license plate
                string licensePlate;
                int attempts = 0;
                do
                {
                    licensePlate = RandomDataGenerator.GenerateLicensePlate();
                    attempts++;
                    if (attempts > 100)
                    {
                        _loggingService.LogWarning("Could not generate unique license plate after {Attempts} attempts", attempts);
                        break;
                    }
                } while (usedLicensePlates.Contains(licensePlate));
                usedLicensePlates.Add(licensePlate);
                _loggingService.LogVehicleGeneration("Generated license plate: {LicensePlate} (attempts: {Attempts})", licensePlate, attempts);

                // Select a ticket type that has available lots (weighted by availability)
                _loggingService.LogVehicleGeneration("Selecting ticket type...");
                var selectedTicketType = RandomDataGenerator.SelectTicketTypeByAvailability(currentAvailableTypes);
                _loggingService.LogVehicleGeneration("Selected ticket type: {TicketType}", selectedTicketType);

                // Decrease availability for the selected ticket type
                if (workingAvailability.ContainsKey(selectedTicketType))
                {
                    workingAvailability[selectedTicketType]--;
                    _loggingService.LogVehicleGeneration("Updated availability for {TicketType}: {RemainingLots} lots remaining",
                        selectedTicketType, workingAvailability[selectedTicketType]);
                }

                // Select a compatible vehicle type based on ticket type (business rule)
                _loggingService.LogVehicleGeneration("Selecting compatible vehicle type...");
                var selectedVehicleType = RandomDataGenerator.SelectCompatibleVehicleType(selectedTicketType);
                _loggingService.LogVehicleGeneration("Selected vehicle type: {VehicleType}", selectedVehicleType);

                // Generate realistic dimensions that fit within ticket type constraints
                _loggingService.LogVehicleGeneration("Generating constrained dimensions...");
                var dimensions = RandomDataGenerator.GenerateConstrainedDimensions(selectedVehicleType, selectedTicketType);
                _loggingService.LogVehicleGeneration("Generated dimensions: H:{Height:F2} W:{Width:F2} L:{Length:F2}",
                    dimensions.Height, dimensions.Width, dimensions.Length);

                var request = new CheckInRequest
                {
                    Name = RandomDataGenerator.GetRandomName(),
                    LicensePlate = licensePlate,
                    Phone = RandomDataGenerator.GetRandomPhone(),
                    TicketType = selectedTicketType,
                    VehicleType = selectedVehicleType,
                    Height = dimensions.Height,
                    Width = dimensions.Width,
                    Length = dimensions.Length
                };

                requests.Add(request);

                _loggingService.LogVehicleGeneration("COMPLETED vehicle {Current}: {LicensePlate} - {VehicleType} for {TicketType} ticket (H:{Height:F2} W:{Width:F2} L:{Length:F2})",
                    i + 1, licensePlate, selectedVehicleType, selectedTicketType, dimensions.Height, dimensions.Width, dimensions.Length);
            }

            _loggingService.LogVehicleGeneration("=== COMPLETED GENERATING {Count} VEHICLES (Generated: {ActualCount}) ===", count, requests.Count);

            // If we couldn't generate all requested vehicles, log a warning
            if (requests.Count < count)
            {
                _loggingService.LogWarning("Could only generate {ActualCount} out of {RequestedCount} vehicles due to limited availability",
                    requests.Count, count);
            }

            return requests.ToArray();
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error in GenerateRandomCheckInRequestsAsync");
            throw;
        }
    }

    #endregion

    #region Helper Methods for Creating Results

    private static AsyncCheckInResult CreateNoLotsAvailableResult()
    {
        return new AsyncCheckInResult
        {
            Results = new List<AsyncCheckInItem>
            {
                new AsyncCheckInItem
                {
                    LicensePlate = "N/A",
                    Name = "N/A",
                    Phone = "N/A",
                    TicketType = 0,
                    VehicleType = 0,
                    Height = 0,
                    Width = 0,
                    Length = 0,
                    Success = false,
                    Message = "No available parking lots. The garage is full.",
                    LotNumber = 0
                }
            },
            TotalProcessed = 0,
            Successful = 0,
            Failed = 1
        };
    }

    private static CheckInRequest CreateNoAvailableLotsRequest()
    {
        return new CheckInRequest
        {
            Name = "No Available Lots",
            LicensePlate = "N/A",
            Phone = "N/A",
            TicketType = 0, // Invalid ticket type
            VehicleType = 0, // Invalid vehicle type
            Height = 0,
            Width = 0,
            Length = 0
        };
    }

    private static CheckInResult CreateNoSuitableTicketResult()
    {
        return new CheckInResult
        {
            Message = "No suitable ticket type found for this vehicle",
            LotNumber = 0,
            RequiresUpgrade = false,
            UpgradeCost = 0
        };
    }

    private static CheckInResult CreateNoAvailableLotsResult()
    {
        return new CheckInResult
        {
            Message = "No available lots for this ticket type",
            LotNumber = 0,
            RequiresUpgrade = false,
            UpgradeCost = 0
        };
    }

    private static CheckInResult CreateVehicleCreationFailedResult()
    {
        return new CheckInResult
        {
            Message = "Failed to create vehicle record",
            LotNumber = 0,
            RequiresUpgrade = false,
            UpgradeCost = 0
        };
    }

    private static CheckInResult CreateSuccessResult(CheckInRequest request, TicketType ticketType, int lotNumber, bool requiresUpgrade)
    {
        return new CheckInResult
        {
            LotNumber = lotNumber,
            Message = requiresUpgrade
                ? $"Vehicle checked in with upgrade to {ticketType} ticket"
                : "Vehicle checked in successfully",
            RequiresUpgrade = requiresUpgrade,
            UpgradeCost = 0,
            LicensePlate = request.LicensePlate,
            Name = request.Name,
            Phone = request.Phone,
            TicketType = request.TicketType,
            VehicleType = request.VehicleType,
            Height = request.Height,
            Width = request.Width,
            Length = request.Length
        };
    }

    #endregion

    #region Filter Options and Garage Statistics (keeping existing methods)

    public async Task<List<dynamic>> GetFilterTicketTypesAsync()
    {
        try
        {
            _loggingService.LogInfo("Getting available ticket types for filtering");

            var result = await _context.Database.SqlQueryRaw<dynamic>(
                "EXEC GetAvailableTicketTypes"
            ).ToListAsync();

            _loggingService.LogInfo("Retrieved {Count} available ticket types", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting available ticket types");
            return new List<dynamic>();
        }
    }

    public async Task<List<dynamic>> GetFilterStatusTypesAsync()
    {
        try
        {
            _loggingService.LogInfo("Getting available status types for filtering");

            var result = await _context.Database.SqlQueryRaw<dynamic>(
                "EXEC GetAvailableStatusTypes"
            ).ToListAsync();

            _loggingService.LogInfo("Retrieved {Count} available status types", result.Count);
            return result;
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting available status types");
            return new List<dynamic>();
        }
    }

    public async Task<GarageStateResponse> GetGarageStateWithStatisticsAsync(int? ticketTypeFilter = null, int? statusFilter = null)
    {
        try
        {
            _loggingService.LogInfo("Getting garage state with statistics - TicketType: {TicketType}, Status: {Status}",
                ticketTypeFilter?.ToString() ?? "All", statusFilter?.ToString() ?? "All");

            // Get all lots for statistics (unfiltered)
            var allLots = await _context.ParkingLots
                .Include(l => l.Vehicle)
                .ToListAsync();

            // Get filtered lots for display
            List<ParkingLot> filteredLots;
            if (ticketTypeFilter == null && statusFilter == null)
            {
                filteredLots = allLots.OrderBy(l => l.LotNumber).ToList();
            }
            else
            {
                // Use stored procedure for filtered results
                var results = await _context.Database.SqlQueryRaw<GarageStateDto>(
                    "EXEC GetGarageStateWithFilters @TicketTypeFilter, @StatusFilter",
                    new Microsoft.Data.SqlClient.SqlParameter("@TicketTypeFilter", ticketTypeFilter ?? (object)DBNull.Value),
                    new Microsoft.Data.SqlClient.SqlParameter("@StatusFilter", statusFilter ?? (object)DBNull.Value)
                ).ToListAsync();

                // Convert DTO results to ParkingLot objects
                filteredLots = ConvertDtoResultsToParkingLots(results);
            }

            // Calculate comprehensive statistics from all lots (unfiltered)
            var statistics = CalculateGarageStatistics(allLots);

            // Map to DTOs to eliminate duplicate data
            var lotsDto = filteredLots.Select(MapToParkingLotDto).ToList();

            return new GarageStateResponse
            {
                Lots = lotsDto,
                Statistics = statistics
            };
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting garage state with statistics");
            throw;
        }
    }

    private List<ParkingLot> ConvertDtoResultsToParkingLots(List<GarageStateDto> results)
    {
        var parkingLots = new List<ParkingLot>();
        foreach (var result in results)
        {
            // Create ParkingLot using the public constructor
            var lot = new ParkingLot(result.LotNumber, result.TicketType);

            // Use reflection to set private properties for EF Core mapping
            var lotType = typeof(ParkingLot);
            lotType.GetProperty("Id")?.SetValue(lot, result.Id);
            lotType.GetProperty("Status")?.SetValue(lot, result.Status);
            lotType.GetProperty("VehicleId")?.SetValue(lot, result.VehicleId);

            // Add vehicle if exists
            if (result.VehicleId != null && result.Name != null && result.VehicleType.HasValue)
            {
                var vehicle = new ParkedVehicle(
                    result.Name,
                    result.LicensePlate ?? "",
                    result.Phone ?? "",
                    result.TicketType,
                    result.VehicleType.Value,
                    result.Height ?? 0,
                    result.Width ?? 0,
                    result.Length ?? 0,
                    result.LotNumber
                );

                // Use reflection to set private properties
                var vehicleType = typeof(ParkedVehicle);
                vehicleType.GetProperty("Id")?.SetValue(vehicle, result.VehicleId.Value);
                vehicleType.GetProperty("CheckInTime")?.SetValue(vehicle, result.CheckInTime);
                vehicleType.GetProperty("CheckOutTime")?.SetValue(vehicle, result.CheckOutTime);
                vehicleType.GetProperty("TotalCost")?.SetValue(vehicle, result.TotalCost);

                lotType.GetProperty("Vehicle")?.SetValue(lot, vehicle);
            }

            parkingLots.Add(lot);
        }

        return parkingLots;
    }

    private GarageStatistics CalculateGarageStatistics(List<ParkingLot> allLots)
    {
        var totalLots = allLots.Count;
        var availableLots = allLots.Count(l => l.Status == LotStatus.Available);
        var occupiedLots = allLots.Count(l => l.Status == LotStatus.Occupied);
        var maxRandomVehicles = Math.Min(availableLots, 5);
        var hasAvailableLots = availableLots > 0;

        // Ticket type breakdown
        var vipLots = allLots.Count(l => l.TicketType == TicketType.VIP);
        var valueLots = allLots.Count(l => l.TicketType == TicketType.Value);
        var regularLots = allLots.Count(l => l.TicketType == TicketType.Regular);

        var vipAvailable = allLots.Count(l => l.TicketType == TicketType.VIP && l.Status == LotStatus.Available);
        var valueAvailable = allLots.Count(l => l.TicketType == TicketType.Value && l.Status == LotStatus.Available);
        var regularAvailable = allLots.Count(l => l.TicketType == TicketType.Regular && l.Status == LotStatus.Available);

        var vipOccupied = allLots.Count(l => l.TicketType == TicketType.VIP && l.Status == LotStatus.Occupied);
        var valueOccupied = allLots.Count(l => l.TicketType == TicketType.Value && l.Status == LotStatus.Occupied);
        var regularOccupied = allLots.Count(l => l.TicketType == TicketType.Regular && l.Status == LotStatus.Occupied);

        // Vehicle type breakdown
        var motorcycleCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.Motorcycle);
        var privateCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.Private);
        var crossoverCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.Crossover);
        var suvCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.SUV);
        var vanCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.Van);
        var truckCount = allLots.Count(l => l.Vehicle?.VehicleType == VehicleType.Truck);

        return new GarageStatistics
        {
            TotalLots = totalLots,
            AvailableLots = availableLots,
            OccupiedLots = occupiedLots,
            MaxRandomVehicles = maxRandomVehicles,
            HasAvailableLots = hasAvailableLots,
            VipLots = vipLots,
            ValueLots = valueLots,
            RegularLots = regularLots,
            VipAvailable = vipAvailable,
            ValueAvailable = valueAvailable,
            RegularAvailable = regularAvailable,
            VipOccupied = vipOccupied,
            ValueOccupied = valueOccupied,
            RegularOccupied = regularOccupied,
            MotorcycleCount = motorcycleCount,
            PrivateCount = privateCount,
            CrossoverCount = crossoverCount,
            SuvCount = suvCount,
            VanCount = vanCount,
            TruckCount = truckCount
        };
    }

    #endregion

    #region Minimal Update Methods

    public async Task<SingleLotUpdateResponse> GetSingleLotUpdateAsync(int lotNumber)
    {
        try
        {
            _loggingService.LogInfo("Getting single lot update for lot number: {LotNumber}", lotNumber);

            // Get the specific updated lot
            var updatedLot = await _context.ParkingLots
                .Include(l => l.Vehicle)
                .FirstOrDefaultAsync(l => l.LotNumber == lotNumber);

            if (updatedLot == null)
            {
                throw new InvalidOperationException($"Lot number {lotNumber} not found");
            }

            // Get all lots for statistics calculation (efficient - no includes needed)
            var allLots = await _context.ParkingLots.ToListAsync();
            var statistics = CalculateGarageStatistics(allLots);

            return new SingleLotUpdateResponse
            {
                Statistics = statistics,
                UpdatedLot = MapToParkingLotDto(updatedLot)
            };
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting single lot update for lot number: {LotNumber}", lotNumber);
            throw;
        }
    }

    public async Task<MinimalUpdateResponse> GetMultipleLotUpdateAsync(List<int> lotNumbers)
    {
        try
        {
            _loggingService.LogInfo("Getting multiple lot updates for lots: {LotNumbers}", string.Join(", ", lotNumbers));

            // Get the specific updated lots
            var updatedLots = await _context.ParkingLots
                .Include(l => l.Vehicle)
                .Where(l => lotNumbers.Contains(l.LotNumber))
                .OrderBy(l => l.LotNumber)
                .ToListAsync();

            // Get all lots for statistics calculation (efficient - no includes needed)
            var allLots = await _context.ParkingLots.ToListAsync();
            var statistics = CalculateGarageStatistics(allLots);

            return new MinimalUpdateResponse
            {
                Statistics = statistics,
                UpdatedLots = updatedLots.Select(MapToParkingLotDto).ToList()
            };
        }
        catch (Exception ex)
        {
            _loggingService.LogError(ex, "Error getting multiple lot updates for lots: {LotNumbers}", string.Join(", ", lotNumbers));
            throw;
        }
    }

    #endregion

    #region Mapping Methods

    private static ParkingLotDto MapToParkingLotDto(ParkingLot lot)
    {
        return new ParkingLotDto
        {
            Id = lot.Id,
            LotNumber = lot.LotNumber,
            TicketType = lot.TicketType,
            Status = lot.Status,
            VehicleId = lot.VehicleId,
            Vehicle = lot.Vehicle != null ? MapToParkedVehicleDto(lot.Vehicle) : null
        };
    }

    private static ParkedVehicleDto MapToParkedVehicleDto(ParkedVehicle vehicle)
    {
        return new ParkedVehicleDto
        {
            Id = vehicle.Id,
            Name = vehicle.Name,
            LicensePlate = vehicle.LicensePlate,
            Phone = vehicle.Phone,
            TicketType = vehicle.TicketType,
            VehicleType = vehicle.VehicleType,
            Height = vehicle.Height,
            Width = vehicle.Width,
            Length = vehicle.Length,
            CheckInTime = vehicle.CheckInTime,
            CheckOutTime = vehicle.CheckOutTime,
            TotalCost = vehicle.TotalCost
        };
    }

    #endregion
}
