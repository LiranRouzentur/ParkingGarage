// Simple API test without axios mocking issues
import { parkingApi } from "../api";

describe("ParkingApi", () => {
  it("should be defined", () => {
    expect(parkingApi).toBeDefined();
  });

  it("should have required methods", () => {
    expect(typeof parkingApi.checkInVehicle).toBe("function");
    expect(typeof parkingApi.checkOutVehicle).toBe("function");
    expect(typeof parkingApi.getGarageState).toBe("function");
    expect(typeof parkingApi.asyncCheckInVehicles).toBe("function");
    expect(typeof parkingApi.getVehiclesByTicketType).toBe("function");
    expect(typeof parkingApi.generateRandomData).toBe("function");
    expect(typeof parkingApi.checkInVehicleWithUpgrade).toBe("function");
  });
});
