using ParkingGarage.Api.Entities;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.Models;

namespace ParkingGarage.Api.Interfaces;

public interface IParkingService
{
    Task<CheckInResult> CheckInVehicleAsync(CheckInRequest request);
    Task<CheckOutResult> CheckOutVehicleAsync(CheckOutRequest request);
    Task<List<ParkingLot>> GetGarageStateAsync(int? ticketTypeFilter = null, int? statusFilter = null);
    Task<GarageStateResponse> GetGarageStateWithStatisticsAsync(int? ticketTypeFilter = null, int? statusFilter = null);
    Task<AsyncCheckInResult> AsyncCheckInVehiclesAsync(int? requestedCount = null);
    Task<List<ParkedVehicle>> GetVehiclesByTicketTypeAsync(TicketType ticketType);
    Task<CheckInRequest> GenerateRandomDataAsync();
    Task<CheckInResult> CheckInVehicleWithUpgradeAsync(CheckInRequest request);
    Task<List<dynamic>> GetFilterTicketTypesAsync();
    Task<List<dynamic>> GetFilterStatusTypesAsync();
    Task<SingleLotUpdateResponse> GetSingleLotUpdateAsync(int lotNumber);
    Task<MinimalUpdateResponse> GetMultipleLotUpdateAsync(List<int> lotNumbers);
}

public class CheckInRequest
{
    public string Name { get; set; } = string.Empty;
    public string LicensePlate { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public TicketType TicketType { get; set; }
    public VehicleType VehicleType { get; set; }
    public decimal Height { get; set; }
    public decimal Width { get; set; }
    public decimal Length { get; set; }
}

public class CheckOutRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public int LotNumber { get; set; }
}

public class CheckInResult
{
    public int LotNumber { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool RequiresUpgrade { get; set; }
    public decimal UpgradeCost { get; set; }
    public TicketType? SuggestedTicketType { get; set; }

    // Additional fields for unified processing
    public string LicensePlate { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public TicketType TicketType { get; set; }
    public VehicleType VehicleType { get; set; }
    public decimal Height { get; set; }
    public decimal Width { get; set; }
    public decimal Length { get; set; }
}

public class CheckOutResult
{
    public string VehicleName { get; set; } = string.Empty;
    public int LotNumber { get; set; }
    public DateTime CheckInTime { get; set; }
    public DateTime CheckOutTime { get; set; }
    public decimal TotalCost { get; set; }
}

public class AsyncCheckInResult
{
    public int TotalProcessed { get; set; }
    public int Successful { get; set; }
    public int Failed { get; set; }
    public List<AsyncCheckInItem> Results { get; set; } = new();
}

public class AsyncCheckInItem
{
    public string LicensePlate { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public TicketType TicketType { get; set; }
    public VehicleType VehicleType { get; set; }
    public decimal Height { get; set; }
    public decimal Width { get; set; }
    public decimal Length { get; set; }
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int? LotNumber { get; set; }
}
