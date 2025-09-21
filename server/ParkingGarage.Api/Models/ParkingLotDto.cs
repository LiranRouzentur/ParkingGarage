using ParkingGarage.Api.Enums;

namespace ParkingGarage.Api.Models;

// DTO for ParkingLot that uses optimized ParkedVehicleDto (without redundant lotNumber)
public class ParkingLotDto
{
    public int Id { get; set; }
    public int LotNumber { get; set; }
    public TicketType TicketType { get; set; }
    public LotStatus Status { get; set; }
    public int? VehicleId { get; set; }
    public ParkedVehicleDto? Vehicle { get; set; }
}
