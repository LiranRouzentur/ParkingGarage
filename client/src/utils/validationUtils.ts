import { CheckInRequest } from "../types";

/**
 * Validation utilities for parking garage forms
 * Implements PRD validation requirements
 */

export interface ValidationErrors {
  name?: boolean;
  licensePlate?: boolean;
  phone?: boolean;
  ticketType?: boolean;
  vehicleType?: boolean;
  height?: boolean;
  width?: boolean;
  length?: boolean;
}

export interface ServerErrorMessages {
  name?: string;
  licensePlate?: string;
  phone?: string;
  ticketType?: string;
  vehicleType?: string;
  height?: string;
  width?: string;
  length?: string;
}

/**
 * Validate check-in form data and return validation errors
 */
export const validateCheckInForm = (
  formData: CheckInRequest
): {
  errors: string[];
  validationErrors: ValidationErrors;
} => {
  const errors: string[] = [];
  const validationErrors: ValidationErrors = {};

  if (!formData.name.trim()) {
    errors.push("Name");
    validationErrors.name = true;
  }
  if (!formData.licensePlate.trim()) {
    errors.push("License Plate");
    validationErrors.licensePlate = true;
  }
  if (!formData.phone.trim()) {
    errors.push("Phone");
    validationErrors.phone = true;
  }
  if (formData.ticketType === "placeholder") {
    errors.push("Ticket Type");
    validationErrors.ticketType = true;
  }
  if (formData.vehicleType === "placeholder") {
    errors.push("Vehicle Type");
    validationErrors.vehicleType = true;
  }
  if (!formData.height || formData.height <= 0) {
    errors.push("Height");
    validationErrors.height = true;
  }
  if (!formData.width || formData.width <= 0) {
    errors.push("Width");
    validationErrors.width = true;
  }
  if (!formData.length || formData.length <= 0) {
    errors.push("Length");
    validationErrors.length = true;
  }

  return { errors, validationErrors };
};

/**
 * Parse server validation errors and map them to form fields
 */
export const parseServerValidationErrors = (
  serverErrors: any
): {
  validationErrors: ValidationErrors;
  serverErrorMessages: ServerErrorMessages;
} => {
  const validationErrors: ValidationErrors = {};
  const serverErrorMessages: ServerErrorMessages = {};

  // Return empty objects if serverErrors is null or undefined
  if (!serverErrors) {
    return { validationErrors, serverErrorMessages };
  }

  // Map server field errors to our validation state
  if (serverErrors["$.name"]) {
    validationErrors.name = true;
    serverErrorMessages.name = serverErrors["$.name"][0] || "Name is invalid";
  }
  if (serverErrors["$.licensePlate"]) {
    validationErrors.licensePlate = true;
    serverErrorMessages.licensePlate =
      serverErrors["$.licensePlate"][0] || "License Plate is invalid";
  }
  if (serverErrors["$.phone"]) {
    validationErrors.phone = true;
    serverErrorMessages.phone =
      serverErrors["$.phone"][0] || "Phone is invalid";
  }
  if (serverErrors["$.ticketType"]) {
    validationErrors.ticketType = true;
    serverErrorMessages.ticketType =
      serverErrors["$.ticketType"][0] || "Ticket Type is invalid";
  }
  if (serverErrors["$.vehicleType"]) {
    validationErrors.vehicleType = true;
    serverErrorMessages.vehicleType =
      serverErrors["$.vehicleType"][0] || "Vehicle Type is invalid";
  }
  if (serverErrors["$.height"]) {
    validationErrors.height = true;
    serverErrorMessages.height =
      serverErrors["$.height"][0] || "Height is invalid";
  }
  if (serverErrors["$.width"]) {
    validationErrors.width = true;
    serverErrorMessages.width =
      serverErrors["$.width"][0] || "Width is invalid";
  }
  if (serverErrors["$.length"]) {
    validationErrors.length = true;
    serverErrorMessages.length =
      serverErrors["$.length"][0] || "Length is invalid";
  }

  return { validationErrors, serverErrorMessages };
};
