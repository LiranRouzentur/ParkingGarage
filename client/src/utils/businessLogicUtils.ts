import { VehicleType, TicketType } from "../types";

/**
 * Business logic utilities for parking garage operations
 * Implements PRD business rules for vehicle classes and ticket compatibility
 */

/**
 * Get vehicle class based on vehicle type (PRD business rule)
 */
export const getVehicleClass = (vehicleType: number): string => {
  // Class A: Motorcycle, Private, Crossover
  if (
    [
      VehicleType.Motorcycle,
      VehicleType.Private,
      VehicleType.Crossover,
    ].includes(vehicleType)
  ) {
    return "A";
  }
  // Class B: SUV, Van
  if ([VehicleType.SUV, VehicleType.Van].includes(vehicleType)) {
    return "B";
  }
  // Class C: Truck
  if (vehicleType === VehicleType.Truck) {
    return "C";
  }
  return "A"; // Default
};

/**
 * Check if a vehicle type is compatible with a ticket type (PRD business rule)
 */
export const isVehicleTypeCompatibleWithTicketType = (
  vehicleType: number,
  ticketType: number
): boolean => {
  const vehicleClass = getVehicleClass(vehicleType);

  switch (ticketType) {
    case TicketType.VIP:
      return true; // VIP allows all classes
    case TicketType.Value:
      return vehicleClass === "A" || vehicleClass === "B";
    case TicketType.Regular:
      return vehicleClass === "A";
    default:
      return false;
  }
};

/**
 * Get compatible vehicle types for a given ticket type
 */
export const getCompatibleVehicleTypes = (
  selectedTicketType: number
): Set<number> => {
  const compatibleTypes = new Set<number>();

  // Get vehicle types that are compatible with the selected ticket type
  Object.values(VehicleType).forEach((vehicleType) => {
    if (typeof vehicleType === "number") {
      const isCompatible = isVehicleTypeCompatibleWithTicketType(
        vehicleType,
        selectedTicketType
      );
      if (isCompatible) {
        compatibleTypes.add(vehicleType);
      }
    }
  });

  return compatibleTypes;
};

/**
 * Calculate available ticket types based on current garage state
 */
export const getAvailableTicketTypes = (lots: any[]): Set<number> => {
  const availableTypes = new Set<number>();
  lots.forEach((lot) => {
    if (lot.status === 1) {
      // Available lot
      availableTypes.add(lot.ticketType);
    }
  });
  return availableTypes;
};

/**
 * Check if a lot should be shown based on current filters
 */
export const shouldShowLotInFilteredView = (
  lot: any,
  filters: { ticketType: string; status: string }
): boolean => {
  // Check ticket type filter
  const ticketTypeMatch =
    filters.ticketType === "allTypes" ||
    (filters.ticketType === "vip" && lot.ticketType === 1) ||
    (filters.ticketType === "value" && lot.ticketType === 2) ||
    (filters.ticketType === "regular" && lot.ticketType === 3);

  // Check status filter
  const statusMatch =
    filters.status === "allStatus" ||
    (filters.status === "available" && lot.status === 1) ||
    (filters.status === "occupied" && lot.status === 2);

  return ticketTypeMatch && statusMatch;
};
