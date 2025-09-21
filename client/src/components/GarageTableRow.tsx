import React from "react";
import { TableRow, TableCell, Box, Typography, Chip } from "@mui/material";
import { ParkingLot, TicketType } from "../types";
import { formatDateTimeSeparate } from "../utils/dateUtils";
import { getTicketTypeName, getVehicleTypeName } from "../utils/enumUtils";
import { LiveCountdown } from "./LiveCountdown";

interface GarageTableRowProps {
  lot: ParkingLot;
  onLotClick: (lot: ParkingLot) => void;
}

/**
 * Component for individual garage table rows
 * Displays lot information and vehicle details as per PRD requirements
 */
export const GarageTableRow: React.FC<GarageTableRowProps> = ({
  lot,
  onLotClick,
}) => {
  const handleRowClick = () => {
    if (lot.status === 2 && lot.vehicle) {
      onLotClick(lot);
    }
  };

  return (
    <TableRow
      hover
      onClick={handleRowClick}
      sx={{
        cursor: lot.status === 2 ? "pointer" : "default",
        "&:hover":
          lot.status === 2
            ? {
                backgroundColor: "rgba(0, 229, 255, 0.08)",
              }
            : {},
      }}
    >
      <TableCell>
        <Typography variant="body2" fontWeight={600}>
          #{lot.lotNumber}
        </Typography>
      </TableCell>

      <TableCell>
        <Chip
          label={getTicketTypeName(lot.ticketType)}
          color={
            lot.ticketType === TicketType.VIP
              ? "secondary"
              : lot.ticketType === TicketType.Value
              ? "primary"
              : "default"
          }
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </TableCell>

      <TableCell>
        <Chip
          label={lot.status === 2 ? "Occupied" : "Available"}
          color={lot.status === 2 ? "info" : "success"}
          size="small"
          sx={{ fontWeight: 600 }}
        />
      </TableCell>

      <TableCell>
        {lot.vehicle ? (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {lot.vehicle.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lot.vehicle.phone}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        )}
      </TableCell>

      <TableCell>
        {lot.vehicle ? (
          <Box>
            <Typography variant="body2" fontWeight={600}>
              {getVehicleTypeName(lot.vehicle.vehicleType)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {lot.vehicle.licensePlate.value}
            </Typography>
            <br />
            <Typography variant="caption" color="text.secondary">
              {lot.vehicle.height.toFixed(2)}m × {lot.vehicle.width.toFixed(2)}m
              × {lot.vehicle.length.toFixed(2)}m
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        )}
      </TableCell>

      <TableCell align="center">
        {lot.vehicle ? (
          <Box sx={{ textAlign: "center" }}>
            <Typography variant="body2" fontWeight={600}>
              {formatDateTimeSeparate(lot.vehicle.checkInTime).date}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDateTimeSeparate(lot.vehicle.checkInTime).time}
            </Typography>
          </Box>
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        )}
      </TableCell>

      <TableCell align="center">
        {lot.vehicle ? (
          lot.ticketType === TicketType.VIP ? (
            <Typography variant="body2" color="text.secondary">
              -
            </Typography>
          ) : (
            <LiveCountdown
              checkInTime={lot.vehicle.checkInTime}
              ticketType={lot.ticketType.toString()}
            />
          )
        ) : (
          <Typography variant="body2" color="text.secondary">
            -
          </Typography>
        )}
      </TableCell>
    </TableRow>
  );
};
