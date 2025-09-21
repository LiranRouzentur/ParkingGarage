import { TicketType, VehicleType } from "../types";

/**
 * Utility functions for converting between enum values and display text
 * Implements PRD business rules for ticket types and vehicle types
 */

export const getTicketTypeText = (ticketType: any): string => {
  if (typeof ticketType === "string") return ticketType;
  switch (ticketType) {
    case 1:
      return "VIP";
    case 2:
      return "Value";
    case 3:
      return "Regular";
    default:
      return "Unknown";
  }
};

export const getVehicleTypeText = (vehicleType: any): string => {
  if (typeof vehicleType === "string") return vehicleType;
  switch (vehicleType) {
    case 1:
      return "Motorcycle";
    case 2:
      return "Private";
    case 3:
      return "Crossover";
    case 4:
      return "SUV";
    case 5:
      return "Van";
    case 6:
      return "Truck";
    default:
      return "Unknown";
  }
};

export const getTicketTypeName = (type: TicketType): string => {
  switch (type) {
    case TicketType.VIP:
      return "VIP";
    case TicketType.Value:
      return "Value";
    case TicketType.Regular:
      return "Regular";
    default:
      return "Unknown";
  }
};

export const getVehicleTypeName = (type: number): string => {
  switch (type) {
    case 1:
      return "Motorcycle";
    case 2:
      return "Private";
    case 3:
      return "Crossover";
    case 4:
      return "SUV";
    case 5:
      return "Van";
    case 6:
      return "Truck";
    default:
      return "Unknown";
  }
};

/**
 * Convert string enum values to numbers for API calls
 * Handles both string and number inputs as per PRD requirements
 */
export const convertRequestForApi = (request: any) => {
  return {
    ...request,
    ticketType:
      typeof request.ticketType === "string" &&
      request.ticketType !== "placeholder"
        ? request.ticketType === "VIP"
          ? 1
          : request.ticketType === "Value"
          ? 2
          : 3
        : request.ticketType,
    vehicleType:
      typeof request.vehicleType === "string" &&
      request.vehicleType !== "placeholder"
        ? request.vehicleType === "Motorcycle"
          ? 1
          : request.vehicleType === "Private"
          ? 2
          : request.vehicleType === "Crossover"
          ? 3
          : request.vehicleType === "SUV"
          ? 4
          : request.vehicleType === "Van"
          ? 5
          : 6
        : request.vehicleType,
  };
};
