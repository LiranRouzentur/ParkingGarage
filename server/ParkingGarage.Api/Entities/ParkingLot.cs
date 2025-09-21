using ParkingGarage.Api.Enums;

namespace ParkingGarage.Api.Entities;

public class ParkingLot
{
    public int Id { get; private set; }
    public int LotNumber { get; private set; }
    public TicketType TicketType { get; private set; }
    public LotStatus Status { get; private set; }
    public int? VehicleId { get; private set; }
    public ParkedVehicle? Vehicle { get; private set; }

    private ParkingLot() { } // EF Core constructor

    public ParkingLot(int lotNumber, TicketType ticketType)
    {
        LotNumber = lotNumber;
        TicketType = ticketType;
        Status = LotStatus.Available;
    }

    public void AssignVehicle(int vehicleId)
    {
        if (Status != LotStatus.Available)
            throw new InvalidOperationException("Cannot assign vehicle to occupied lot");

        VehicleId = vehicleId;
        Status = LotStatus.Occupied;
    }

    public void ReleaseVehicle()
    {
        VehicleId = null;
        Vehicle = null;
        Status = LotStatus.Available;
    }

    public void ReserveLot()
    {
        if (Status != LotStatus.Available)
            throw new InvalidOperationException("Cannot reserve occupied lot");

        Status = LotStatus.Occupied;
        // Don't set VehicleId yet - will be set when vehicle is created
    }

    public void SetVehicleId(int vehicleId)
    {
        if (Status != LotStatus.Occupied)
            throw new InvalidOperationException("Cannot set vehicle ID on non-occupied lot");

        VehicleId = vehicleId;
    }

    public bool IsAvailable()
    {
        return Status == LotStatus.Available;
    }
}
