// Vehicle Classes
export enum VehicleClass {
  A = 1,
  B = 2,
  C = 3,
}

// Vehicle Types
export enum VehicleType {
  Motorcycle = 1, // Class A
  Private = 2, // Class A
  Crossover = 3, // Class A
  SUV = 4, // Class B
  Van = 5, // Class B
  Truck = 6, // Class C
}

// Ticket Types
export enum TicketType {
  VIP = 1,
  Value = 2,
  Regular = 3,
}

// Parking Lot Status
export enum LotStatus {
  Available = 1,
  Occupied = 2,
}

// Check-in Request
export interface CheckInRequest {
  name: string;
  licensePlate: string;
  phone: string;
  ticketType: TicketType | "placeholder";
  vehicleType: VehicleType | "placeholder";
  height: number;
  width: number;
  length: number;
}

// Check-out Request
export interface CheckOutRequest {
  licensePlate: string;
  lotNumber: number;
}

// Vehicle in Garage (optimized - lotNumber removed as it's redundant with ParkingLot.lotNumber)
export interface ParkedVehicle {
  id: number;
  name: string;
  licensePlate: {
    value: string;
  };
  phone: string;
  ticketType: TicketType;
  vehicleType: VehicleType;
  height: number;
  width: number;
  length: number;
  // Removed: lotNumber - redundant with ParkingLot.lotNumber
  checkInTime: string;
  checkOutTime?: string;
  totalCost: number;
}

// Parking Lot
export interface ParkingLot {
  id: number;
  lotNumber: number;
  ticketType: TicketType;
  status: LotStatus;
  vehicleId?: number;
  vehicle?: ParkedVehicle;
}

// Ticket Type Configuration
export interface TicketTypeConfig {
  type: TicketType;
  name: string;
  lotRange: { min: number; max: number };
  dimensions: {
    height: number;
    width: number;
    length: number;
  };
  cost: number;
  timeLimitHours?: number;
  allowedClasses: VehicleClass[];
}

// API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

// Async Check-in Result
export interface AsyncCheckInResult {
  totalProcessed: number;
  successful: number;
  failed: number;
  results: {
    licensePlate: string;
    name: string;
    phone: string;
    ticketType: number;
    vehicleType: number;
    height: number;
    width: number;
    length: number;
    success: boolean;
    message: string;
    lotNumber?: number;
  }[];
}

// Garage Statistics
export interface GarageStatistics {
  totalLots: number;
  availableLots: number;
  occupiedLots: number;
  maxRandomVehicles: number;
  hasAvailableLots: boolean;

  // Ticket type breakdown
  vipLots: number;
  valueLots: number;
  regularLots: number;
  vipAvailable: number;
  valueAvailable: number;
  regularAvailable: number;
  vipOccupied: number;
  valueOccupied: number;
  regularOccupied: number;

  // Vehicle type breakdown
  motorcycleCount: number;
  privateCount: number;
  crossoverCount: number;
  suvCount: number;
  vanCount: number;
  truckCount: number;
}

// Garage State Response
export interface GarageStateResponse {
  lots: ParkingLot[];
  statistics: GarageStatistics;
}

// Flattened Response Structure (no more minimalUpdate wrapper)
export interface SingleLotUpdateResponse {
  statistics: GarageStatistics;
  updatedLot: ParkingLot;
  // Removed: operationDetails - all essential data is in updatedLot and API response message
}

export interface MinimalUpdateResponse {
  statistics: GarageStatistics;
  updatedLots: ParkingLot[];
  // Removed: operationDetails - all essential data is in updatedLots and API response message
}

// Flattened API Response Structure
export interface FlattenedCheckInResponse {
  statistics: GarageStatistics;
  updatedLot: ParkingLot;
}

export interface FlattenedCheckOutResponse {
  statistics: GarageStatistics;
  updatedLot: ParkingLot;
}

export interface FlattenedAsyncCheckInResponse {
  asyncCheckInResult: any; // Keep existing structure
  statistics?: GarageStatistics;
  updatedLots?: ParkingLot[];
}
