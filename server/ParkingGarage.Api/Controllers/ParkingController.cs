using Microsoft.AspNetCore.Mvc;
using ParkingGarage.Api.Interfaces;
using ParkingGarage.Api.Enums;
using ParkingGarage.Api.ValueObjects;
using ParkingGarage.Api.Models;

namespace ParkingGarage.Api.Controllers;

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string Message { get; set; } = string.Empty;
}

[ApiController]
[Route("api/[controller]")]
public class ParkingController : ControllerBase
{
    private readonly IParkingService _parkingService;

    public ParkingController(IParkingService parkingService)
    {
        _parkingService = parkingService;
    }

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckInVehicle([FromBody] CheckInRequest request)
    {
        try
        {
            var appRequest = new CheckInRequest
            {
                Name = request.Name,
                LicensePlate = request.LicensePlate,
                Phone = request.Phone,
                TicketType = request.TicketType,
                VehicleType = request.VehicleType,
                Height = request.Height,
                Width = request.Width,
                Length = request.Length
            };

            var result = await _parkingService.CheckInVehicleAsync(appRequest);

            if (result.RequiresUpgrade || result.LotNumber == 0)
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Data = result,
                    Message = result.Message
                });
            }

            // Get minimal update data for the affected lot
            var minimalUpdate = await _parkingService.GetSingleLotUpdateAsync(result.LotNumber);

            // No operationDetails needed - all essential data is in updatedLot and API response message

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    statistics = minimalUpdate.Statistics,
                    updatedLot = minimalUpdate.UpdatedLot
                },
                Message = "Vehicle checked in successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOutVehicle([FromBody] CheckOutRequest request)
    {
        try
        {
            var appRequest = new CheckOutRequest
            {
                LicensePlate = request.LicensePlate,
                LotNumber = request.LotNumber
            };

            var result = await _parkingService.CheckOutVehicleAsync(appRequest);

            // Get minimal update data for the affected lot
            var minimalUpdate = await _parkingService.GetSingleLotUpdateAsync(result.LotNumber);

            // No need for OperationDetails - all checkout information is already in updatedLot.vehicle
            // (checkOutTime, totalCost, vehicleName, lotNumber, checkInTime)

            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    statistics = minimalUpdate.Statistics,
                    updatedLot = minimalUpdate.UpdatedLot
                },
                Message = "Vehicle checked out successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("garage-state")]
    public async Task<IActionResult> GetGarageState([FromQuery] int? ticketType = null, [FromQuery] int? status = null)
    {
        try
        {
            var garageState = await _parkingService.GetGarageStateWithStatisticsAsync(ticketType, status);
            return Ok(new { success = true, data = garageState, message = "Garage state retrieved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpPost("async-checkin")]
    public async Task<IActionResult> AsyncCheckInVehicles([FromBody] int? count = null)
    {
        try
        {
            var result = await _parkingService.AsyncCheckInVehiclesAsync(count);

            // Check if any vehicles were successfully checked in
            if (result.Successful == 0)
            {
                // Check if the failure is due to no available lots (garage full)
                var firstResult = result.Results?.FirstOrDefault();
                if (firstResult != null && firstResult.Message?.Contains("No available parking lots") == true)
                {
                    // Return 200 OK with warning message for garage full scenario
                    return Ok(new ApiResponse<object>
                    {
                        Success = false,
                        Data = new
                        {
                            totalProcessed = result.TotalProcessed,
                            successful = result.Successful,
                            failed = result.Failed
                        },
                        Message = "The garage is full! No available parking lots for new vehicles."
                    });
                }

                // Return BadRequest for other types of failures
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Data = new
                    {
                        totalProcessed = result.TotalProcessed,
                        successful = result.Successful,
                        failed = result.Failed
                    },
                    Message = $"Async check-in failed: {result.Failed} out of {result.TotalProcessed} vehicles failed to check in"
                });
            }

            // Get minimal update data for affected lots
            var affectedLotNumbers = result.Results
                .Where(r => r.Success && r.LotNumber.HasValue)
                .Select(r => r.LotNumber!.Value)
                .ToList();

            MinimalUpdateResponse? minimalUpdate = null;
            if (affectedLotNumbers.Any())
            {
                minimalUpdate = await _parkingService.GetMultipleLotUpdateAsync(affectedLotNumbers);
            }

            // Return success if at least one vehicle was checked in
            return Ok(new ApiResponse<object>
            {
                Success = true,
                Data = new
                {
                    // Flattened summary instead of full asyncCheckInResult
                    totalProcessed = result.TotalProcessed,
                    successful = result.Successful,
                    failed = result.Failed,
                    statistics = minimalUpdate?.Statistics,
                    updatedLots = minimalUpdate?.UpdatedLots
                },
                Message = $"Async check-in completed: {result.Successful} out of {result.TotalProcessed} vehicles checked in successfully"
            });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("vehicles-by-ticket-type/{ticketType}")]
    public async Task<IActionResult> GetVehiclesByTicketType(int ticketType)
    {
        try
        {
            var vehicles = await _parkingService.GetVehiclesByTicketTypeAsync((TicketType)ticketType);
            return Ok(new { success = true, data = vehicles, message = "Vehicles retrieved successfully" });
        }
        catch (Exception ex)
        {
            return BadRequest(new { success = false, message = ex.Message });
        }
    }

    [HttpGet("generate-random-data")]
    public async Task<IActionResult> GenerateRandomData()
    {
        try
        {
            var randomData = await _parkingService.GenerateRandomDataAsync();
            var response = new CheckInRequest
            {
                Name = randomData.Name,
                LicensePlate = randomData.LicensePlate,
                Phone = randomData.Phone,
                TicketType = randomData.TicketType,
                VehicleType = randomData.VehicleType,
                Height = randomData.Height,
                Width = randomData.Width,
                Length = randomData.Length
            };

            return Ok(new ApiResponse<CheckInRequest>
            {
                Success = true,
                Data = response,
                Message = "Random data generated successfully"
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new ApiResponse<object>
            {
                Success = false,
                Message = $"An error occurred: {ex.Message}"
            });
        }
    }

    [HttpPost("checkin-with-upgrade")]
    public async Task<IActionResult> CheckInVehicleWithUpgrade([FromBody] CheckInRequest request)
    {
        try
        {
            var result = await _parkingService.CheckInVehicleWithUpgradeAsync(request);

            if (result.LotNumber > 0)
            {
                // Get minimal update data for the affected lot
                var minimalUpdate = await _parkingService.GetSingleLotUpdateAsync(result.LotNumber);

                // No operationDetails needed - all essential data is in updatedLot and API response message

                return Ok(new ApiResponse<object>
                {
                    Success = true,
                    Data = new
                    {
                        statistics = minimalUpdate.Statistics,
                        updatedLot = minimalUpdate.UpdatedLot
                    },
                    Message = "Vehicle checked in successfully with upgrade"
                });
            }
            else
            {
                return BadRequest(new ApiResponse<object>
                {
                    Success = false,
                    Data = new { checkInResult = result },
                    Message = result.Message
                });
            }
        }
        catch (Exception ex)
        {
            return BadRequest(new ApiResponse<object>
            {
                Success = false,
                Message = ex.Message
            });
        }
    }

}
