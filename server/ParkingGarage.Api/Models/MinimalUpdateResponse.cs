using ParkingGarage.Api.Entities;

namespace ParkingGarage.Api.Models;

// Minimal response containing only the data needed to update the client efficiently
public class MinimalUpdateResponse
{
    // Updated statistics without full lot data
    public GarageStatistics Statistics { get; set; } = new();

    // Only the specific lots that were affected by the operation
    public List<ParkingLotDto> UpdatedLots { get; set; } = new();
}

// Response for operations that affect a single lot
public class SingleLotUpdateResponse
{
    // Updated statistics
    public GarageStatistics Statistics { get; set; } = new();

    // The single lot that was updated
    public ParkingLotDto UpdatedLot { get; set; } = null!;
}
