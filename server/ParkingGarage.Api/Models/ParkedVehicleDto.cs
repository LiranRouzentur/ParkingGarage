using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Models;

// DTO for ParkedVehicle that excludes redundant lotNumber (since it's already in ParkingLot)
public class ParkedVehicleDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public LicensePlate LicensePlate { get; set; } = null!;
    public string Phone { get; set; } = string.Empty;
    public TicketType TicketType { get; set; }
    public VehicleType VehicleType { get; set; }
    public decimal Height { get; set; }
    public decimal Width { get; set; }
    public decimal Length { get; set; }
    // Removed: LotNumber - redundant with ParkingLot.lotNumber
    public DateTime CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal TotalCost { get; set; }
}
