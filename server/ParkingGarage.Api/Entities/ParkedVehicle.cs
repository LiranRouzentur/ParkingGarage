using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;

namespace ParkingGarage.Api.Entities;

public class ParkedVehicle
{
    public int Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public LicensePlate LicensePlate { get; private set; }
    public string Phone { get; private set; } = string.Empty;
    public TicketType TicketType { get; private set; }
    public VehicleType VehicleType { get; private set; }
    public decimal Height { get; private set; }
    public decimal Width { get; private set; }
    public decimal Length { get; private set; }
    public int LotNumber { get; private set; }
    public DateTime CheckInTime { get; private set; }
    public DateTime? CheckOutTime { get; private set; }
    public decimal TotalCost { get; private set; }

    private ParkedVehicle()
    {
        // EF Core constructor - LicensePlate will be set by EF
        // Use EF Core-specific factory method that bypasses validation
        LicensePlate = LicensePlate.ForEfCore("");
    }

    public ParkedVehicle(
        string name,
        LicensePlate licensePlate,
        string phone,
        TicketType ticketType,
        VehicleType vehicleType,
        decimal height,
        decimal width,
        decimal length,
        int lotNumber,
        DateTime? checkInTime = null)
    {
        Name = name ?? throw new ArgumentNullException(nameof(name));
        LicensePlate = licensePlate ?? throw new ArgumentNullException(nameof(licensePlate));
        Phone = phone ?? throw new ArgumentNullException(nameof(phone));
        TicketType = ticketType;
        VehicleType = vehicleType;
        Height = height;
        Width = width;
        Length = length;
        LotNumber = lotNumber;
        CheckInTime = checkInTime ?? DateTime.UtcNow;
        TotalCost = 0; // Initialize TotalCost to 0
    }

    public void CheckOut(decimal totalCost)
    {
        CheckOutTime = DateTime.UtcNow;
        TotalCost = totalCost;
    }

    public bool IsCurrentlyParked()
    {
        return CheckOutTime == null;
    }
}
