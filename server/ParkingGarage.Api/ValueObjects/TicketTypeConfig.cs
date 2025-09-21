using ParkingGarage.Api.Enums;

namespace ParkingGarage.Api.ValueObjects;


// Simplified ticket type configuration - replaces all the complex hierarchy
public static class TicketTypeConfig
{
    // Ticket type configurations
    private static readonly Dictionary<TicketType, TicketTypeInfo> _configs = new()
    {
        [TicketType.VIP] = new(
            Type: TicketType.VIP,
            Name: "VIP",
            LotRange: (1, 10),
            Cost: 200m,
            TimeLimitHours: null,
            AllowedClasses: new[] { VehicleClass.A, VehicleClass.B, VehicleClass.C },
            MaxDimensions: (0, 0, 0) // No limits
        ),
        [TicketType.Value] = new(
            Type: TicketType.Value,
            Name: "Value",
            LotRange: (11, 30),
            Cost: 100m,
            TimeLimitHours: 72,
            AllowedClasses: new[] { VehicleClass.A, VehicleClass.B },
            MaxDimensions: (2.5m, 2.4m, 5.0m)
        ),
        [TicketType.Regular] = new(
            Type: TicketType.Regular,
            Name: "Regular",
            LotRange: (31, 60),
            Cost: 50m,
            TimeLimitHours: 24,
            AllowedClasses: new[] { VehicleClass.A },
            MaxDimensions: (2.0m, 2.0m, 3.0m)
        )
    };

    public static TicketTypeInfo GetConfig(TicketType type) =>
        _configs.TryGetValue(type, out var config) ? config : throw new ArgumentException($"Unknown ticket type: {type}");

    public static IEnumerable<TicketTypeInfo> GetAllTicketTypes() => _configs.Values;

    public static IEnumerable<TicketTypeInfo> GetCompatibleTicketTypes(VehicleType vehicleType, decimal height, decimal width, decimal length) =>
        _configs.Values.Where(config => config.IsVehicleCompatible(vehicleType, height, width, length));

    public static TicketTypeInfo? FindSuitableTicketType(VehicleType vehicleType, decimal height, decimal width, decimal length) =>
        GetCompatibleTicketTypes(vehicleType, height, width, length).OrderBy(t => t.Cost).FirstOrDefault();

    public static VehicleClass GetVehicleClass(VehicleType vehicleType) => vehicleType switch
    {
        VehicleType.Motorcycle or VehicleType.Private or VehicleType.Crossover => VehicleClass.A,
        VehicleType.SUV or VehicleType.Van => VehicleClass.B,
        VehicleType.Truck => VehicleClass.C,
        _ => throw new ArgumentException($"Unknown vehicle type: {vehicleType}")
    };
}

// Simple record to hold ticket type information
public record TicketTypeInfo(
    TicketType Type,
    string Name,
    (int Min, int Max) LotRange,
    decimal Cost,
    int? TimeLimitHours,
    VehicleClass[] AllowedClasses,
    (decimal Height, decimal Width, decimal Length) MaxDimensions
)
{
    public bool IsVehicleCompatible(VehicleType vehicleType, decimal height, decimal width, decimal length)
    {
        // Check vehicle class compatibility
        var vehicleClass = TicketTypeConfig.GetVehicleClass(vehicleType);
        if (!AllowedClasses.Contains(vehicleClass))
            return false;

        // Check dimension limits (0 means no limit)
        return (MaxDimensions.Height == 0 || height <= MaxDimensions.Height) &&
               (MaxDimensions.Width == 0 || width <= MaxDimensions.Width) &&
               (MaxDimensions.Length == 0 || length <= MaxDimensions.Length);
    }

    public decimal GetUpgradeCost(TicketType currentType)
    {
        var currentConfig = TicketTypeConfig.GetConfig(currentType);
        return Cost - currentConfig.Cost;
    }
}