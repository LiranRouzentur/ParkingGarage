import {
  validateCheckInForm,
  parseServerValidationErrors,
} from "../validationUtils";
import { CheckInRequest, TicketType, VehicleType } from "../../types";

describe("validationUtils", () => {
  describe("validateCheckInForm", () => {
    it("should validate a correct form", () => {
      const validRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(validRequest);

      expect(result.errors).toEqual([]);
      expect(result.validationErrors).toEqual({});
    });

    it("should reject empty name", () => {
      const invalidRequest: CheckInRequest = {
        name: "",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Name");
      expect(result.validationErrors.name).toBe(true);
    });

    it("should reject empty license plate", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("License Plate");
      expect(result.validationErrors.licensePlate).toBe(true);
    });

    it("should reject empty phone", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Phone");
      expect(result.validationErrors.phone).toBe(true);
    });

    it("should reject invalid ticket type", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: "placeholder" as any,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Ticket Type");
      expect(result.validationErrors.ticketType).toBe(true);
    });

    it("should reject invalid vehicle type", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: "placeholder" as any,
        height: 2.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Vehicle Type");
      expect(result.validationErrors.vehicleType).toBe(true);
    });

    it("should reject negative dimensions", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: -1.0,
        width: 2.0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Height");
      expect(result.validationErrors.height).toBe(true);
    });

    it("should reject zero dimensions", () => {
      const invalidRequest: CheckInRequest = {
        name: "John Doe",
        licensePlate: "ABC-123",
        phone: "555-1234",
        ticketType: TicketType.Regular,
        vehicleType: VehicleType.Private,
        height: 2.0,
        width: 0,
        length: 4.5,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Width");
      expect(result.validationErrors.width).toBe(true);
    });

    it("should accumulate multiple errors", () => {
      const invalidRequest: CheckInRequest = {
        name: "",
        licensePlate: "",
        phone: "",
        ticketType: "placeholder" as any,
        vehicleType: "placeholder" as any,
        height: -1.0,
        width: 0,
        length: 0,
      };

      const result = validateCheckInForm(invalidRequest);

      expect(result.errors).toContain("Name");
      expect(result.errors).toContain("License Plate");
      expect(result.errors).toContain("Phone");
      expect(result.errors).toContain("Ticket Type");
      expect(result.errors).toContain("Vehicle Type");
      expect(result.errors).toContain("Height");
      expect(result.errors).toContain("Width");
      expect(result.errors).toContain("Length");
    });
  });

  describe("parseServerValidationErrors", () => {
    it("should parse server validation errors correctly", () => {
      const serverError = {
        "$.name": ["Name is required"],
        "$.licensePlate": ["License plate format is invalid"],
        "$.phone": ["Phone number is required"],
      };

      const result = parseServerValidationErrors(serverError);

      expect(result.validationErrors.name).toBe(true);
      expect(result.validationErrors.licensePlate).toBe(true);
      expect(result.validationErrors.phone).toBe(true);
      expect(result.serverErrorMessages.name).toBe("Name is required");
      expect(result.serverErrorMessages.licensePlate).toBe(
        "License plate format is invalid"
      );
      expect(result.serverErrorMessages.phone).toBe("Phone number is required");
    });

    it("should handle missing response data", () => {
      const serverError = null;

      const result = parseServerValidationErrors(serverError);

      expect(result.validationErrors).toEqual({});
      expect(result.serverErrorMessages).toEqual({});
    });

    it("should handle missing errors object", () => {
      const serverError = {
        message: "General error",
      };

      const result = parseServerValidationErrors(serverError);

      expect(result.validationErrors).toEqual({});
      expect(result.serverErrorMessages).toEqual({});
    });

    it("should handle non-response errors", () => {
      const serverError = new Error("Network error");

      const result = parseServerValidationErrors(serverError);

      expect(result.validationErrors).toEqual({});
      expect(result.serverErrorMessages).toEqual({});
    });

    it("should handle empty errors object", () => {
      const serverError = {};

      const result = parseServerValidationErrors(serverError);

      expect(result.validationErrors).toEqual({});
      expect(result.serverErrorMessages).toEqual({});
    });
  });
});
