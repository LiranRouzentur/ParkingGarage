import axios from "axios";
import {
  CheckInRequest,
  CheckOutRequest,
  ParkingLot,
  GarageStateResponse,
} from "../types";

const API_BASE_URL =
  process.env.REACT_APP_API_URL || "http://localhost:5034/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    console.error("API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error("API Response Error:", error.response?.data || error.message);
    return Promise.reject(error);
  }
);

export const parkingApi = {
  // Check in a vehicle
  checkInVehicle: async (
    request: CheckInRequest
  ): Promise<{
    success: boolean;
    data: {
      statistics: any;
      updatedLot: ParkingLot;
    };
    message: string;
  }> => {
    // Convert string values to enum numbers
    const convertedRequest = {
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

    const response = await api.post("/parking/checkin", convertedRequest);
    return response.data;
  },

  // Check out a vehicle
  checkOutVehicle: async (
    request: CheckOutRequest
  ): Promise<{
    success: boolean;
    data: {
      statistics: any;
      updatedLot: ParkingLot;
    };
    message: string;
  }> => {
    const response = await api.post("/parking/checkout", request);
    return response.data;
  },

  // Get current garage state with optional filters
  getGarageState: async (
    ticketType?: number,
    status?: number
  ): Promise<GarageStateResponse> => {
    const params = new URLSearchParams();
    if (ticketType !== undefined)
      params.append("ticketType", ticketType.toString());
    if (status !== undefined) params.append("status", status.toString());

    const queryString = params.toString();
    const url = queryString
      ? `/parking/garage-state?${queryString}`
      : "/parking/garage-state";

    const response = await api.get(url);
    return response.data.data;
  },

  // Async check-in of random vehicles
  asyncCheckInVehicles: async (
    count?: number
  ): Promise<{
    totalProcessed: number;
    successful: number;
    failed: number;
    statistics?: any;
    updatedLots?: ParkingLot[];
  }> => {
    const response = await api.post("/parking/async-checkin", count);
    return response.data.data;
  },

  // Get vehicles by ticket type (stored procedure)
  getVehiclesByTicketType: async (ticketType: number): Promise<any[]> => {
    const response = await api.get(
      `/parking/vehicles-by-ticket-type/${ticketType}`
    );
    return response.data.data;
  },

  // Generate random data for UI form population
  generateRandomData: async (): Promise<CheckInRequest> => {
    const response = await api.get("/parking/generate-random-data");
    return response.data.data;
  },

  // Check in vehicle with upgrade
  checkInVehicleWithUpgrade: async (
    request: CheckInRequest
  ): Promise<{
    success: boolean;
    data: {
      statistics: any;
      updatedLot: ParkingLot;
    };
    message: string;
  }> => {
    const response = await api.post("/parking/checkin-with-upgrade", request);
    return response.data;
  },
};

export default api;
