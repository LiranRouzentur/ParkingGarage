using ParkingGarage.Api.Entities;

namespace ParkingGarage.Api.Models;

public class GarageStateResponse
{
    public List<ParkingLotDto> Lots { get; set; } = new();
    public GarageStatistics Statistics { get; set; } = new();
}

public class GarageStatistics
{
    public int TotalLots { get; set; }
    public int AvailableLots { get; set; }
    public int OccupiedLots { get; set; }
    public int MaxRandomVehicles { get; set; }
    public bool HasAvailableLots { get; set; }

    // Ticket type breakdown
    public int VipLots { get; set; }
    public int ValueLots { get; set; }
    public int RegularLots { get; set; }
    public int VipAvailable { get; set; }
    public int ValueAvailable { get; set; }
    public int RegularAvailable { get; set; }
    public int VipOccupied { get; set; }
    public int ValueOccupied { get; set; }
    public int RegularOccupied { get; set; }

    // Vehicle type breakdown
    public int MotorcycleCount { get; set; }
    public int PrivateCount { get; set; }
    public int CrossoverCount { get; set; }
    public int SuvCount { get; set; }
    public int VanCount { get; set; }
    public int TruckCount { get; set; }
}
