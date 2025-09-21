import {
  getVehicleClass,
  isVehicleTypeCompatibleWithTicketType,
  getCompatibleVehicleTypes,
  getAvailableTicketTypes,
  shouldShowLotInFilteredView,
} from "../businessLogicUtils";
import { VehicleType, TicketType } from "../../types";

describe("businessLogicUtils", () => {
  describe("getVehicleClass", () => {
    it("should return Class A for Motorcycle", () => {
      expect(getVehicleClass(VehicleType.Motorcycle)).toBe("A");
    });

    it("should return Class A for Private vehicle", () => {
      expect(getVehicleClass(VehicleType.Private)).toBe("A");
    });

    it("should return Class A for Crossover vehicle", () => {
      expect(getVehicleClass(VehicleType.Crossover)).toBe("A");
    });

    it("should return Class B for SUV", () => {
      expect(getVehicleClass(VehicleType.SUV)).toBe("B");
    });

    it("should return Class B for Van", () => {
      expect(getVehicleClass(VehicleType.Van)).toBe("B");
    });

    it("should return Class C for Truck", () => {
      expect(getVehicleClass(VehicleType.Truck)).toBe("C");
    });

    it("should return Class A as default for unknown vehicle type", () => {
      expect(getVehicleClass(999)).toBe("A");
    });
  });

  describe("isVehicleTypeCompatibleWithTicketType", () => {
    it("should allow all vehicle types with VIP ticket", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Motorcycle,
          TicketType.VIP
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Private,
          TicketType.VIP
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Crossover,
          TicketType.VIP
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.SUV, TicketType.VIP)
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.Van, TicketType.VIP)
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.Truck, TicketType.VIP)
      ).toBe(true);
    });

    it("should allow Class A and B vehicles with Value ticket", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Motorcycle,
          TicketType.Value
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Private,
          TicketType.Value
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Crossover,
          TicketType.Value
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.SUV, TicketType.Value)
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.Van, TicketType.Value)
      ).toBe(true);
    });

    it("should not allow Class C vehicles with Value ticket", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Truck,
          TicketType.Value
        )
      ).toBe(false);
    });

    it("should allow only Class A vehicles with Regular ticket", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Motorcycle,
          TicketType.Regular
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Private,
          TicketType.Regular
        )
      ).toBe(true);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Crossover,
          TicketType.Regular
        )
      ).toBe(true);
    });

    it("should not allow Class B and C vehicles with Regular ticket", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.SUV,
          TicketType.Regular
        )
      ).toBe(false);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Van,
          TicketType.Regular
        )
      ).toBe(false);
      expect(
        isVehicleTypeCompatibleWithTicketType(
          VehicleType.Truck,
          TicketType.Regular
        )
      ).toBe(false);
    });

    it("should return false for unknown ticket type", () => {
      expect(
        isVehicleTypeCompatibleWithTicketType(VehicleType.Private, 999)
      ).toBe(false);
    });
  });

  describe("getCompatibleVehicleTypes", () => {
    it("should return all vehicle types for VIP ticket", () => {
      const compatibleTypes = getCompatibleVehicleTypes(TicketType.VIP);

      expect(compatibleTypes.has(VehicleType.Motorcycle)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Private)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Crossover)).toBe(true);
      expect(compatibleTypes.has(VehicleType.SUV)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Van)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Truck)).toBe(true);
      expect(compatibleTypes.size).toBe(6);
    });

    it("should return Class A and B vehicle types for Value ticket", () => {
      const compatibleTypes = getCompatibleVehicleTypes(TicketType.Value);

      expect(compatibleTypes.has(VehicleType.Motorcycle)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Private)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Crossover)).toBe(true);
      expect(compatibleTypes.has(VehicleType.SUV)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Van)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Truck)).toBe(false);
      expect(compatibleTypes.size).toBe(5);
    });

    it("should return only Class A vehicle types for Regular ticket", () => {
      const compatibleTypes = getCompatibleVehicleTypes(TicketType.Regular);

      expect(compatibleTypes.has(VehicleType.Motorcycle)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Private)).toBe(true);
      expect(compatibleTypes.has(VehicleType.Crossover)).toBe(true);
      expect(compatibleTypes.has(VehicleType.SUV)).toBe(false);
      expect(compatibleTypes.has(VehicleType.Van)).toBe(false);
      expect(compatibleTypes.has(VehicleType.Truck)).toBe(false);
      expect(compatibleTypes.size).toBe(3);
    });

    it("should return empty set for unknown ticket type", () => {
      const compatibleTypes = getCompatibleVehicleTypes(999);
      expect(compatibleTypes.size).toBe(0);
    });
  });

  describe("getAvailableTicketTypes", () => {
    it("should return ticket types for available lots", () => {
      const lots = [
        { status: 1, ticketType: TicketType.VIP }, // Available VIP
        { status: 2, ticketType: TicketType.VIP }, // Occupied VIP
        { status: 1, ticketType: TicketType.Value }, // Available Value
        { status: 1, ticketType: TicketType.Regular }, // Available Regular
        { status: 2, ticketType: TicketType.Regular }, // Occupied Regular
      ];

      const availableTypes = getAvailableTicketTypes(lots);

      expect(availableTypes.has(TicketType.VIP)).toBe(true);
      expect(availableTypes.has(TicketType.Value)).toBe(true);
      expect(availableTypes.has(TicketType.Regular)).toBe(true);
      expect(availableTypes.size).toBe(3);
    });

    it("should return empty set when no lots are available", () => {
      const lots = [
        { status: 2, ticketType: TicketType.VIP },
        { status: 2, ticketType: TicketType.Value },
        { status: 2, ticketType: TicketType.Regular },
      ];

      const availableTypes = getAvailableTicketTypes(lots);
      expect(availableTypes.size).toBe(0);
    });

    it("should handle empty lots array", () => {
      const availableTypes = getAvailableTicketTypes([]);
      expect(availableTypes.size).toBe(0);
    });

    it("should only include unique ticket types", () => {
      const lots = [
        { status: 1, ticketType: TicketType.VIP },
        { status: 1, ticketType: TicketType.VIP },
        { status: 1, ticketType: TicketType.Value },
        { status: 1, ticketType: TicketType.Value },
        { status: 1, ticketType: TicketType.Regular },
      ];

      const availableTypes = getAvailableTicketTypes(lots);
      expect(availableTypes.size).toBe(3);
    });
  });

  describe("shouldShowLotInFilteredView", () => {
    const mockLot = {
      lotNumber: 1,
      status: 1, // Available
      ticketType: TicketType.VIP,
      parkedVehicle: null,
    };

    it("should show lot when no filters are applied", () => {
      const filters = { ticketType: "allTypes", status: "allStatus" };
      expect(shouldShowLotInFilteredView(mockLot, filters)).toBe(true);
    });

    it("should show VIP lot when VIP filter is applied", () => {
      const filters = { ticketType: "vip", status: "allStatus" };
      expect(shouldShowLotInFilteredView(mockLot, filters)).toBe(true);
    });

    it("should not show Value lot when VIP filter is applied", () => {
      const valueLot = { ...mockLot, ticketType: TicketType.Value };
      const filters = { ticketType: "vip", status: "allStatus" };
      expect(shouldShowLotInFilteredView(valueLot, filters)).toBe(false);
    });

    it("should not show Regular lot when VIP filter is applied", () => {
      const regularLot = { ...mockLot, ticketType: TicketType.Regular };
      const filters = { ticketType: "vip", status: "allStatus" };
      expect(shouldShowLotInFilteredView(regularLot, filters)).toBe(false);
    });

    it("should show Value lot when Value filter is applied", () => {
      const valueLot = { ...mockLot, ticketType: TicketType.Value };
      const filters = { ticketType: "value", status: "allStatus" };
      expect(shouldShowLotInFilteredView(valueLot, filters)).toBe(true);
    });

    it("should show Regular lot when Regular filter is applied", () => {
      const regularLot = { ...mockLot, ticketType: TicketType.Regular };
      const filters = { ticketType: "regular", status: "allStatus" };
      expect(shouldShowLotInFilteredView(regularLot, filters)).toBe(true);
    });

    it("should show available lot when available filter is applied", () => {
      const filters = { ticketType: "allTypes", status: "available" };
      expect(shouldShowLotInFilteredView(mockLot, filters)).toBe(true);
    });

    it("should not show occupied lot when available filter is applied", () => {
      const occupiedLot = { ...mockLot, status: 2 }; // Occupied
      const filters = { ticketType: "allTypes", status: "available" };
      expect(shouldShowLotInFilteredView(occupiedLot, filters)).toBe(false);
    });

    it("should show occupied lot when occupied filter is applied", () => {
      const occupiedLot = { ...mockLot, status: 2 }; // Occupied
      const filters = { ticketType: "allTypes", status: "occupied" };
      expect(shouldShowLotInFilteredView(occupiedLot, filters)).toBe(true);
    });

    it("should not show available lot when occupied filter is applied", () => {
      const filters = { ticketType: "allTypes", status: "occupied" };
      expect(shouldShowLotInFilteredView(mockLot, filters)).toBe(false);
    });

    it("should apply both ticket type and status filters", () => {
      const occupiedVIPLot = { ...mockLot, status: 2 }; // Occupied VIP
      const filters = { ticketType: "vip", status: "occupied" };
      expect(shouldShowLotInFilteredView(occupiedVIPLot, filters)).toBe(true);
    });

    it("should not show lot when filters do not match", () => {
      const occupiedVIPLot = { ...mockLot, status: 2 }; // Occupied VIP
      const filters = { ticketType: "vip", status: "available" };
      expect(shouldShowLotInFilteredView(occupiedVIPLot, filters)).toBe(false);
    });

    it("should handle unknown filter values gracefully", () => {
      const filters = { ticketType: "unknown", status: "unknown" };
      expect(shouldShowLotInFilteredView(mockLot, filters)).toBe(false);
    });
  });
});
