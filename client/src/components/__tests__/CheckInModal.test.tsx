// Simple component test without complex mocking
import React from "react";
import { render } from "@testing-library/react";
import { CheckInModal } from "../CheckInModal";
import { ParkingLot, TicketType, VehicleType } from "../../types";

describe("CheckInModal", () => {
  const mockLots: ParkingLot[] = [
    {
      lotNumber: 1,
      status: "Available",
      ticketType: TicketType.VIP,
      parkedVehicle: null,
    },
  ];

  const mockOnClose = jest.fn();
  const mockOnSuccess = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render without crashing", () => {
    render(
      <CheckInModal
        lots={mockLots}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    );
  });
});
