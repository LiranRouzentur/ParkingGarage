import React from "react";
import { TableHead, TableRow, TableCell, Box, Typography } from "@mui/material";
import {
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

interface GarageTableHeaderProps {
  sortConfig: SortConfig;
  onSort: (key: string) => void;
}

/**
 * Component for garage table header with sorting functionality
 * Implements PRD requirement for displaying parking lot information
 */
export const GarageTableHeader: React.FC<GarageTableHeaderProps> = ({
  sortConfig,
  onSort,
}) => {
  const SortableHeaderCell: React.FC<{
    sortKey: string;
    children: React.ReactNode;
  }> = ({ sortKey, children }) => (
    <TableCell>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          cursor: "pointer",
          "&:hover": { opacity: 0.7 },
        }}
        onClick={() => onSort(sortKey)}
      >
        <Typography variant="subtitle2" fontWeight={700}>
          {children}
        </Typography>
        {sortConfig.key === sortKey &&
          (sortConfig.direction === "desc" ? (
            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
          ) : (
            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
          ))}
      </Box>
    </TableCell>
  );

  return (
    <TableHead>
      <TableRow>
        <SortableHeaderCell sortKey="lotNumber">Lot #</SortableHeaderCell>
        <SortableHeaderCell sortKey="ticketType">
          Ticket Type
        </SortableHeaderCell>
        <SortableHeaderCell sortKey="status">Status</SortableHeaderCell>
        <TableCell>
          <Typography variant="subtitle2" fontWeight={700}>
            Info
          </Typography>
        </TableCell>
        <SortableHeaderCell sortKey="vehicleType">
          Vehicle Type
        </SortableHeaderCell>
        <TableCell align="center">
          <SortableHeaderCell sortKey="checkInTime">
            Check-in Time
          </SortableHeaderCell>
        </TableCell>
        <TableCell align="center">
          <Typography variant="subtitle2" fontWeight={700}>
            Time Left
          </Typography>
        </TableCell>
      </TableRow>
    </TableHead>
  );
};
