using Microsoft.EntityFrameworkCore;

namespace ParkingGarage.Api.Data;

/// <summary>
/// Handles database initialization tasks including stored procedure creation
/// </summary>
public static class DatabaseInitializer
{
    /// <summary>
    /// Creates all stored procedures required by the application
    /// </summary>
    public static async Task CreateStoredProceduresAsync(ParkingGarageDbContext context)
    {
        // Drop existing procedure first
        await context.Database.ExecuteSqlRawAsync(@"
IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'GetGarageStateWithFilters')
    DROP PROCEDURE GetGarageStateWithFilters");

        // Create the consolidated stored procedure
        await context.Database.ExecuteSqlRawAsync(@"
CREATE PROCEDURE GetGarageStateWithFilters
    @TicketTypeFilter INT = NULL,
    @StatusFilter INT = NULL,
    @VehiclesOnly BIT = 0
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        pl.Id,
        pl.LotNumber,
        pl.TicketType,
        pl.Status,
        pl.VehicleId,
        pv.Name,
        pv.LicensePlate,
        pv.Phone,
        pv.VehicleType,
        pv.Height,
        pv.Width,
        pv.Length,
        pv.CheckInTime,
        pv.CheckOutTime,
        pv.TotalCost
    FROM ParkingLots pl
    LEFT JOIN ParkedVehicles pv ON pl.VehicleId = pv.Id
    WHERE (@TicketTypeFilter IS NULL OR pl.TicketType = @TicketTypeFilter)
      AND (@StatusFilter IS NULL OR pl.Status = @StatusFilter)
      AND (@VehiclesOnly = 0 OR pv.Id IS NOT NULL)
      AND (@VehiclesOnly = 0 OR pv.CheckOutTime IS NULL)
    ORDER BY 
        CASE WHEN @VehiclesOnly = 1 THEN pv.CheckInTime ELSE NULL END DESC,
        CASE WHEN @VehiclesOnly = 0 THEN pl.LotNumber ELSE NULL END;
END");
    }
}
