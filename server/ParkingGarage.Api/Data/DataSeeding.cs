using Microsoft.EntityFrameworkCore;
using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;
using ParkingGarage.Api.Data;

namespace ParkingGarage.Api;

public static class DataSeeding
{
    public static async Task SeedDataAsync(ParkingGarageDbContext context)
    {
        try
        {
            // Check if data already exists
            if (await context.ParkingLots.AnyAsync())
            {
                Console.WriteLine("Data already exists, skipping seeding.");
                return;
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Error checking existing data: {ex.Message}");
            // Tables don't exist yet, continue with seeding
        }

        // Create 60 parking lots (10 VIP, 20 Value, 30 Regular)
        var lots = new List<ParkingLot>();

        // VIP lots (1-10)
        for (int i = 1; i <= 10; i++)
        {
            lots.Add(new ParkingLot(i, TicketType.VIP));
        }

        // Value lots (11-30)
        for (int i = 11; i <= 30; i++)
        {
            lots.Add(new ParkingLot(i, TicketType.Value));
        }

        // Regular lots (31-60)
        for (int i = 31; i <= 60; i++)
        {
            lots.Add(new ParkingLot(i, TicketType.Regular));
        }

        context.ParkingLots.AddRange(lots);
        await context.SaveChangesAsync();

        // Generate random vehicles to occupy some lots (not all)
        var random = new Random();
        var mockVehicles = new List<ParkedVehicle>();
        var occupiedLotNumbers = new List<int>();
        var usedLicensePlates = new HashSet<string>();

        // Generate random vehicles with different characteristics
        var names = new[] { "John Doe", "Jane Smith", "Bob Johnson", "Alice Brown", "Charlie Wilson",
                           "Diana Prince", "Bruce Wayne", "Clark Kent", "Tony Stark", "Steve Rogers",
                           "Peter Parker", "Natasha Romanoff", "Thor Odinson", "Wanda Maximoff", "Vision",
                           "Sam Wilson", "Bucky Barnes", "Scott Lang", "Hope van Dyne", "Carol Danvers",
                           "T'Challa", "Shuri", "Okoye", "M'Baku", "Nakia", "Erik Killmonger", "Wakanda",
                           "Asgard", "Midgard", "Jotunheim" };

        // Country codes for phone numbers
        var countryCodes = new[] { "+1", "+44", "+33", "+49", "+39", "+34", "+81", "+86", "+91", "+55", "+61", "+7", "+82", "+31", "+46" };

        var vehicleTypes = Enum.GetValues<VehicleType>();
        var ticketTypes = new[] { TicketType.VIP, TicketType.Value, TicketType.Regular };

        // Randomly select 20-25 lots to occupy (not all 60)
        var totalLotsToOccupy = random.Next(20, 26);
        var availableLots = Enumerable.Range(1, 60).ToList();

        for (int i = 0; i < totalLotsToOccupy; i++)
        {
            // Randomly select a lot number
            var lotIndex = random.Next(availableLots.Count);
            var lotNumber = availableLots[lotIndex];
            availableLots.RemoveAt(lotIndex);
            occupiedLotNumbers.Add(lotNumber);

            // Determine ticket type based on lot number
            var ticketType = lotNumber <= 10 ? TicketType.VIP :
                           lotNumber <= 30 ? TicketType.Value :
                           TicketType.Regular;

            // Select vehicle type based on ticket type restrictions
            VehicleType vehicleType;
            if (ticketType == TicketType.VIP)
            {
                // VIP can have any vehicle type (all classes)
                vehicleType = vehicleTypes[random.Next(vehicleTypes.Length)];
            }
            else if (ticketType == TicketType.Value)
            {
                // Value can only have Class A and B vehicles
                var allowedTypes = new[] { VehicleType.Motorcycle, VehicleType.Private, VehicleType.Crossover, VehicleType.SUV, VehicleType.Van };
                vehicleType = allowedTypes[random.Next(allowedTypes.Length)];
            }
            else // Regular
            {
                // Regular can only have Class A vehicles
                var allowedTypes = new[] { VehicleType.Motorcycle, VehicleType.Private, VehicleType.Crossover };
                vehicleType = allowedTypes[random.Next(allowedTypes.Length)];
            }

            // Generate dimensions that respect ticket type limits
            var (height, width, length) = GetVehicleDimensionsForTicketType(vehicleType, ticketType, random);

            // Generate phone number with random country code
            var countryCode = countryCodes[random.Next(countryCodes.Length)];
            var phoneNumber = $"{countryCode} {random.Next(100, 999)}-{random.Next(100, 999)}-{random.Next(1000, 9999)}";

            // Generate realistic check-in time based on ticket type
            var randomCheckInTime = GetRealisticCheckInTime(ticketType, random, i);

            // Generate unique license plate
            string licensePlateValue;
            do
            {
                licensePlateValue = $"RND{random.Next(1000, 9999)}";
            } while (usedLicensePlates.Contains(licensePlateValue));

            usedLicensePlates.Add(licensePlateValue);

            var vehicle = new ParkedVehicle(
                names[i],
                LicensePlate.Create(licensePlateValue),
                phoneNumber,
                ticketType,
                vehicleType,
                height, width, length,
                lotNumber,
                randomCheckInTime
            );

            mockVehicles.Add(vehicle);
        }

        Console.WriteLine("Adding mock vehicles...");
        context.ParkedVehicles.AddRange(mockVehicles);
        await context.SaveChangesAsync();
        Console.WriteLine($"Added {mockVehicles.Count} vehicles to database.");

        // Update the corresponding parking lots after vehicles are saved
        Console.WriteLine("Updating parking lots...");
        for (int i = 0; i < mockVehicles.Count; i++)
        {
            var lot = await context.ParkingLots.FindAsync(mockVehicles[i].LotNumber);
            if (lot != null)
            {
                lot.AssignVehicle(mockVehicles[i].Id);
                Console.WriteLine($"Assigned vehicle {mockVehicles[i].Id} to lot {mockVehicles[i].LotNumber}");
            }
        }

        await context.SaveChangesAsync();
        Console.WriteLine($"Mock data seeding completed successfully! {mockVehicles.Count} out of 60 lots are now occupied.");
    }

    private static DateTime GetRealisticCheckInTime(TicketType ticketType, Random random, int vehicleIndex)
    {
        var now = DateTime.UtcNow;

        // Make 3 specific records exceed their time limits for testing
        if (vehicleIndex < 3)
        {
            return ticketType switch
            {
                TicketType.Value =>
                    // Value ticket that exceeds 72h limit (80+ hours ago)
                    now.AddHours(-random.Next(80, 100))
                        .AddMinutes(-random.Next(0, 60))
                        .AddSeconds(-random.Next(0, 60)),

                TicketType.Regular =>
                    // Regular ticket that exceeds 24h limit (30+ hours ago)
                    now.AddHours(-random.Next(30, 50))
                        .AddMinutes(-random.Next(0, 60))
                        .AddSeconds(-random.Next(0, 60)),

                _ => now.AddHours(-random.Next(80, 100))
                    .AddMinutes(-random.Next(0, 60))
                    .AddSeconds(-random.Next(0, 60))
            };
        }

        return ticketType switch
        {
            TicketType.VIP =>
                // VIP can have any time - no limit, so use recent times (last 3 days)
                now.AddHours(-random.Next(0, 72))
                    .AddMinutes(-random.Next(0, 60))
                    .AddSeconds(-random.Next(0, 60)),

            TicketType.Value =>
                // Value has 72h limit, so generate times that leave 12-60 hours remaining
                // This means check-in times should be 12-60 hours ago
                now.AddHours(-random.Next(12, 61))
                    .AddMinutes(-random.Next(0, 60))
                    .AddSeconds(-random.Next(0, 60)),

            TicketType.Regular =>
                // Regular has 24h limit, so generate times that leave 2-20 hours remaining
                // This means check-in times should be 2-20 hours ago
                now.AddHours(-random.Next(2, 21))
                    .AddMinutes(-random.Next(0, 60))
                    .AddSeconds(-random.Next(0, 60)),

            _ => now.AddHours(-random.Next(2, 21))
                .AddMinutes(-random.Next(0, 60))
                .AddSeconds(-random.Next(0, 60))
        };
    }

    private static (decimal height, decimal width, decimal length) GetVehicleDimensionsForTicketType(VehicleType vehicleType, TicketType ticketType, Random random)
    {
        // Get base dimensions for vehicle type
        var (baseHeight, baseWidth, baseLength) = GetBaseVehicleDimensions(vehicleType, random);

        // Apply ticket type limits
        return ticketType switch
        {
            TicketType.VIP => (baseHeight, baseWidth, baseLength), // No limits
            TicketType.Value => (
                Math.Min(baseHeight, 2.5m), // Max height 2500mm
                Math.Min(baseWidth, 2.4m),  // Max width 2400mm
                Math.Min(baseLength, 5.0m)  // Max length 5000mm
            ),
            TicketType.Regular => (
                Math.Min(baseHeight, 2.0m), // Max height 2000mm
                Math.Min(baseWidth, 2.0m),  // Max width 2000mm
                Math.Min(baseLength, 3.0m)  // Max length 3000mm
            ),
            _ => (baseHeight, baseWidth, baseLength)
        };
    }

    private static (decimal height, decimal width, decimal length) GetBaseVehicleDimensions(VehicleType vehicleType, Random random)
    {
        // Helper function to round to .xx precision
        decimal RoundToTwoDecimals(double value) => Math.Round((decimal)value, 2);

        return vehicleType switch
        {
            VehicleType.Motorcycle => (
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 1.0), // 1.0-1.5m height
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 0.7), // 0.7-1.0m width
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 1.8)  // 1.8-2.3m length
            ),
            VehicleType.Private => (
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 1.4), // 1.4-1.7m height
                RoundToTwoDecimals(random.NextDouble() * 0.2 + 1.6), // 1.6-1.8m width
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 4.0)  // 4.0-4.5m length
            ),
            VehicleType.Crossover => (
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 1.6), // 1.6-1.9m height
                RoundToTwoDecimals(random.NextDouble() * 0.2 + 1.7), // 1.7-1.9m width
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 4.2)  // 4.2-4.7m length
            ),
            VehicleType.SUV => (
                RoundToTwoDecimals(random.NextDouble() * 0.4 + 1.7), // 1.7-2.1m height
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 1.8), // 1.8-2.1m width
                RoundToTwoDecimals(random.NextDouble() * 0.8 + 4.5)  // 4.5-5.3m length
            ),
            VehicleType.Van => (
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 2.0), // 2.0-2.5m height
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 1.9), // 1.9-2.2m width
                RoundToTwoDecimals(random.NextDouble() * 1.0 + 5.0)  // 5.0-6.0m length
            ),
            VehicleType.Truck => (
                RoundToTwoDecimals(random.NextDouble() * 0.8 + 2.5), // 2.5-3.3m height
                RoundToTwoDecimals(random.NextDouble() * 0.4 + 2.2), // 2.2-2.6m width
                RoundToTwoDecimals(random.NextDouble() * 2.0 + 6.0)  // 6.0-8.0m length
            ),
            _ => (
                RoundToTwoDecimals(random.NextDouble() * 0.5 + 1.5), // Default
                RoundToTwoDecimals(random.NextDouble() * 0.3 + 1.5),
                RoundToTwoDecimals(random.NextDouble() * 0.8 + 4.0)
            )
        };
    }
}