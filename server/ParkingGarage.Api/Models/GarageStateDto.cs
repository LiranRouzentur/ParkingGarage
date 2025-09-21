using ParkingGarage.Api.Enums;

namespace ParkingGarage.Api.Models;

public class GarageStateDto
{
    public int Id { get; set; }
    public int LotNumber { get; set; }
    public TicketType TicketType { get; set; }
    public LotStatus Status { get; set; }
    public int? VehicleId { get; set; }
    public string? Name { get; set; }
    public string? LicensePlate { get; set; }
    public string? Phone { get; set; }
    public VehicleType? VehicleType { get; set; }
    public decimal? Height { get; set; }
    public decimal? Width { get; set; }
    public decimal? Length { get; set; }
    public DateTime? CheckInTime { get; set; }
    public DateTime? CheckOutTime { get; set; }
    public decimal? TotalCost { get; set; }
}