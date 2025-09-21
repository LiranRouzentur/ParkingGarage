using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Services;

/// <summary>
/// Utility class for generating random vehicle data that complies with PRD business rules
/// </summary>
public static class RandomDataGenerator
{
    private static readonly Random _random = new();

    // Customer data for random generation
    private static readonly string[] CustomerNames = { "John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson" };
    private static readonly string[] CustomerPhones = { "555-0101", "555-0102", "555-0103", "555-0104", "555-0105" };

    public static string GenerateLicensePlate()
    {
        return $"RND{_random.Next(1000, 9999)}";
    }

    public static string GetRandomName() => CustomerNames[_random.Next(CustomerNames.Length)];

    public static string GetRandomPhone() => CustomerPhones[_random.Next(CustomerPhones.Length)];

    /// <summary>
    /// Generate realistic dimensions based on vehicle type
    /// </summary>
    public static (decimal Height, decimal Width, decimal Length) GenerateRealisticDimensions(VehicleType vehicleType)
    {
        return vehicleType switch
        {
            VehicleType.Motorcycle => (
                Height: (decimal)(_random.NextDouble() * 0.5 + 1.0),  // 1.0m to 1.5m
                Width: (decimal)(_random.NextDouble() * 0.3 + 0.7),   // 0.7m to 1.0m
                Length: (decimal)(_random.NextDouble() * 0.5 + 1.8)   // 1.8m to 2.3m
            ),
            VehicleType.Private => (
                Height: (decimal)(_random.NextDouble() * 0.3 + 1.4),  // 1.4m to 1.7m
                Width: (decimal)(_random.NextDouble() * 0.2 + 1.6),   // 1.6m to 1.8m
                Length: (decimal)(_random.NextDouble() * 0.5 + 4.0)   // 4.0m to 4.5m
            ),
            VehicleType.Crossover => (
                Height: (decimal)(_random.NextDouble() * 0.2 + 1.6),  // 1.6m to 1.8m
                Width: (decimal)(_random.NextDouble() * 0.2 + 1.7),   // 1.7m to 1.9m
                Length: (decimal)(_random.NextDouble() * 0.3 + 4.2)   // 4.2m to 4.5m
            ),
            VehicleType.SUV => (
                Height: (decimal)(_random.NextDouble() * 0.3 + 1.7),  // 1.7m to 2.0m
                Width: (decimal)(_random.NextDouble() * 0.2 + 1.8),   // 1.8m to 2.0m
                Length: (decimal)(_random.NextDouble() * 0.5 + 4.5)   // 4.5m to 5.0m
            ),
            VehicleType.Van => (
                Height: (decimal)(_random.NextDouble() * 0.4 + 1.8),  // 1.8m to 2.2m
                Width: (decimal)(_random.NextDouble() * 0.2 + 1.9),   // 1.9m to 2.1m
                Length: (decimal)(_random.NextDouble() * 0.8 + 4.8)   // 4.8m to 5.6m
            ),
            VehicleType.Truck => (
                Height: (decimal)(_random.NextDouble() * 0.5 + 2.0),  // 2.0m to 2.5m
                Width: (decimal)(_random.NextDouble() * 0.3 + 2.0),   // 2.0m to 2.3m
                Length: (decimal)(_random.NextDouble() * 1.0 + 6.0)   // 6.0m to 7.0m
            ),
            _ => (
                Height: (decimal)(_random.NextDouble() * 0.3 + 1.4),  // Default
                Width: (decimal)(_random.NextDouble() * 0.2 + 1.6),
                Length: (decimal)(_random.NextDouble() * 0.5 + 4.0)
            )
        };
    }

    /// <summary>
    /// Generate dimensions that fit within ticket type constraints
    /// </summary>
    public static (decimal Height, decimal Width, decimal Length) GenerateConstrainedDimensions(VehicleType vehicleType, TicketType ticketType)
    {
        var config = TicketTypeConfig.GetConfig(ticketType);
        var dimensions = GenerateRealisticDimensions(vehicleType);

        // Apply ticket type constraints
        if (config.MaxDimensions.Height > 0 && dimensions.Height > config.MaxDimensions.Height)
        {
            dimensions.Height = config.MaxDimensions.Height - 0.1m; // Leave small margin
        }

        if (config.MaxDimensions.Width > 0 && dimensions.Width > config.MaxDimensions.Width)
        {
            dimensions.Width = config.MaxDimensions.Width - 0.1m;
        }

        if (config.MaxDimensions.Length > 0 && dimensions.Length > config.MaxDimensions.Length)
        {
            dimensions.Length = config.MaxDimensions.Length - 0.1m;
        }

        // Ensure minimum realistic dimensions
        dimensions.Height = Math.Max(dimensions.Height, 1.0m);
        dimensions.Width = Math.Max(dimensions.Width, 0.5m);
        dimensions.Length = Math.Max(dimensions.Length, 1.5m);

        // Round to 2 decimal places for database storage
        return (
            Math.Round(dimensions.Height, 2),
            Math.Round(dimensions.Width, 2),
            Math.Round(dimensions.Length, 2)
        );
    }

    /// <summary>
    /// Select a vehicle type compatible with the given ticket type
    /// </summary>
    public static VehicleType SelectCompatibleVehicleType(TicketType ticketType)
    {
        return ticketType switch
        {
            TicketType.VIP =>
                Enum.GetValues<VehicleType>()[_random.Next(Enum.GetValues<VehicleType>().Length)],
            TicketType.Value =>
                GetRandomVehicleTypeByClasses(new[] { VehicleClass.A, VehicleClass.B }),
            TicketType.Regular =>
                GetRandomVehicleTypeByClasses(new[] { VehicleClass.A }),
            _ => VehicleType.Private // Fallback
        };
    }

    private static VehicleType GetRandomVehicleTypeByClasses(VehicleClass[] allowedClasses)
    {
        var compatibleTypes = Enum.GetValues<VehicleType>()
            .Where(vt => allowedClasses.Contains(TicketTypeConfig.GetVehicleClass(vt)))
            .ToArray();

        return compatibleTypes[_random.Next(compatibleTypes.Length)];
    }

    /// <summary>
    /// Select a ticket type based on availability (weighted by available lots)
    /// </summary>
    public static TicketType SelectTicketTypeByAvailability(List<(TicketType TicketType, int AvailableLots)> availableTicketTypes)
    {
        if (!availableTicketTypes.Any())
        {
            return TicketType.Regular; // Fallback
        }

        var totalAvailableLots = availableTicketTypes.Sum(x => x.AvailableLots);
        var randomValue = _random.Next(totalAvailableLots);

        var cumulativeLots = 0;
        foreach (var (ticketType, availableLots) in availableTicketTypes)
        {
            cumulativeLots += availableLots;
            if (randomValue < cumulativeLots)
            {
                return ticketType;
            }
        }

        return availableTicketTypes.First().TicketType; // Fallback
    }
}
