import React from "react";
import {
  Box,
  FormControl,
  Select,
  MenuItem,
  CircularProgress,
} from "@mui/material";

interface GarageTableFiltersProps {
  filters: {
    ticketType: string;
    status: string;
  };
  isDataLoading: boolean;
  onFilterChange: (filterType: string, value: string) => void;
}

/**
 * Component for garage table filters
 * Allows filtering by ticket type and status as per PRD requirements
 */
export const GarageTableFilters: React.FC<GarageTableFiltersProps> = ({
  filters,
  isDataLoading,
  onFilterChange,
}) => {
  return (
    <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
      {isDataLoading && <CircularProgress size={20} sx={{ color: "white" }} />}

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={filters.ticketType}
          displayEmpty
          disabled={isDataLoading}
          renderValue={(selected) => {
            if (selected === "allTypes") return "All Tickets";
            if (selected === "vip") return "VIP";
            if (selected === "value") return "Value";
            if (selected === "regular") return "Regular";
            return selected.charAt(0).toUpperCase() + selected.slice(1);
          }}
          onChange={(e) => onFilterChange("ticketType", e.target.value)}
          sx={{
            "& .MuiSelect-icon": { marginRight: 0 },
            "& .MuiSelect-select": { color: "white" },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          <MenuItem value="allTypes">All Tickets</MenuItem>
          <MenuItem value="vip">VIP</MenuItem>
          <MenuItem value="value">Value</MenuItem>
          <MenuItem value="regular">Regular</MenuItem>
        </Select>
      </FormControl>

      <FormControl size="small" sx={{ minWidth: 160 }}>
        <Select
          value={filters.status}
          displayEmpty
          disabled={isDataLoading}
          renderValue={(selected) => {
            if (selected === "allStatus") return "All Status";
            if (selected === "available") return "Available";
            if (selected === "occupied") return "Occupied";
            return selected.charAt(0).toUpperCase() + selected.slice(1);
          }}
          onChange={(e) => onFilterChange("status", e.target.value)}
          sx={{
            "& .MuiSelect-select": { color: "white" },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.3)",
            },
            "&:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "rgba(255, 255, 255, 0.5)",
            },
            "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "primary.main",
            },
          }}
        >
          <MenuItem value="allStatus">All Status</MenuItem>
          <MenuItem value="available">Available</MenuItem>
          <MenuItem value="occupied">Occupied</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
};
