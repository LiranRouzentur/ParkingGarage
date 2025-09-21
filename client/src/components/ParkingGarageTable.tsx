import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
  IconButton,
  Stack,
} from "@mui/material";
import {
  Add as AddIcon,
  Refresh as RefreshIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as MotorcycleIcon,
  LocalParking as ParkingIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
  ArrowUpward as ArrowUpwardIcon,
  ArrowDownward as ArrowDownwardIcon,
} from "@mui/icons-material";
import {
  ParkingLot,
  CheckInRequest,
  VehicleType,
  TicketType,
  GarageStatistics,
} from "../types";
import { parkingApi } from "../services/api";
import { formatDateTimeSeparate } from "../utils/dateUtils";
import { LiveCountdown } from "./LiveCountdown";
import { useToast } from "../contexts/ToastContext";

// Helper functions to convert enum values to text
const getTicketTypeText = (ticketType: any) => {
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

const getVehicleTypeText = (vehicleType: any) => {
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

export function ParkingGarageTable() {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [statistics, setStatistics] = useState<GarageStatistics | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const { showToast } = useToast();
  const [showCheckInForm, setShowCheckInForm] = useState(false);
  const [showAsyncCheckIn, setShowAsyncCheckIn] = useState(false);
  const [checkOutLicensePlate, setCheckOutLicensePlate] = useState("");
  const [isCheckOutLoading, setIsCheckOutLoading] = useState(false);
  const [checkOutResult, setCheckOutResult] = useState<{
    success: boolean;
    message: string;
    details?: any;
  } | null>(null);
  const [filters, setFilters] = useState({
    ticketType: "allTypes",
    status: "allStatus",
  });
  const [showCheckOutDialog, setShowCheckOutDialog] = useState(false);
  const [selectedLot, setSelectedLot] = useState<ParkingLot | null>(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({
    key: "checkInTime",
    direction: "desc",
  });

  // Use statistics from server instead of client-side calculations
  const maxRandomVehicles = statistics?.maxRandomVehicles ?? 0;
  const hasAvailableLots = statistics?.hasAvailableLots ?? false;

  // Helper function to determine if a lot should be shown based on current filters
  const shouldShowLotInFilteredView = useCallback(
    (lot: ParkingLot): boolean => {
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
    },
    [filters.ticketType, filters.status]
  );

  // Load garage state with current filters
  const loadGarageState = useCallback(async () => {
    try {
      setIsDataLoading(true);
      const ticketTypeFilter =
        filters.ticketType === "allTypes"
          ? undefined
          : filters.ticketType === "vip"
          ? 1
          : filters.ticketType === "value"
          ? 2
          : filters.ticketType === "regular"
          ? 3
          : undefined;

      const statusFilter =
        filters.status === "allStatus"
          ? undefined
          : filters.status === "available"
          ? 1
          : filters.status === "occupied"
          ? 2
          : undefined;

      const garageState = await parkingApi.getGarageState(
        ticketTypeFilter,
        statusFilter
      );
      setLots(garageState.lots);
      setStatistics(garageState.statistics);
    } catch (error) {
      console.error("Error loading garage state:", error);
    } finally {
      setIsDataLoading(false);
      setIsInitialLoading(false);
    }
  }, [filters.ticketType, filters.status]);

  useEffect(() => {
    loadGarageState();
  }, [loadGarageState]);

  const handleSort = (key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  };

  const sortLots = (lots: ParkingLot[]) => {
    return [...lots].sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortConfig.key) {
        case "lotNumber":
          aValue = a.lotNumber;
          bValue = b.lotNumber;
          break;
        case "ticketType":
          aValue = a.ticketType;
          bValue = b.ticketType;
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        case "checkInTime":
          aValue = a.vehicle?.checkInTime || "";
          bValue = b.vehicle?.checkInTime || "";
          break;
        case "vehicleType":
          aValue = a.vehicle?.vehicleType || 0;
          bValue = b.vehicle?.vehicleType || 0;
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === "asc" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "asc" ? 1 : -1;
      }
      return 0;
    });
  };

  const handleCheckOut = async () => {
    if (!checkOutLicensePlate.trim()) return;

    setIsCheckOutLoading(true);
    setCheckOutResult(null);

    try {
      const response = await parkingApi.checkOutVehicle({
        licensePlate: checkOutLicensePlate,
        lotNumber: selectedLot?.lotNumber || 0,
      });

      // Update statistics from response
      if (response.data?.statistics) {
        setStatistics(response.data.statistics);
      }

      // Update the specific lot in the table
      if (response.data?.updatedLot) {
        setLots((currentLots) => {
          const updatedLots = [...currentLots];
          const updatedLot = response.data.updatedLot!; // Safe to use ! here since we checked above
          const index = updatedLots.findIndex(
            (lot) => lot.lotNumber === updatedLot.lotNumber
          );

          if (index !== -1) {
            // Check if the updated lot still matches current filters
            if (shouldShowLotInFilteredView(updatedLot)) {
              // Replace existing lot
              updatedLots[index] = updatedLot;
            } else {
              // Remove lot if it no longer matches filters (e.g., became available but filtering for occupied)
              updatedLots.splice(index, 1);
            }
          }

          return updatedLots;
        });
      }

      // Close dialog and show success toast
      setShowCheckOutDialog(false);
      setCheckOutLicensePlate("");
      showToast(
        response.message || "Vehicle checked out successfully!",
        "success"
      );
    } catch (error: any) {
      setCheckOutResult({
        success: false,
        message: error.response?.data?.message || "Failed to check out vehicle",
      });
    } finally {
      setIsCheckOutLoading(false);
    }
  };

  const getTicketTypeName = (type: TicketType) => {
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

  const getVehicleTypeName = (type: number) => {
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

  // Sort lots (filtering is now done server-side)
  const filteredLots = sortLots(lots);

  const occupiedLots = statistics?.occupiedLots ?? 0;
  const totalLots = statistics?.totalLots ?? 0;

  if (isInitialLoading) {
    return (
      <Box
        display="flex"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        minHeight="400px"
        gap={2}
      >
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" color="text.secondary">
          Loading garage state...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {/* Header with Action Buttons */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 3,
        }}
      >
        <Box>
          <Typography
            variant="h3"
            component="h1"
            sx={{
              background: "linear-gradient(45deg, #00e5ff 30%, #ff4081 90%)",
              backgroundClip: "text",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              fontWeight: 700,
              mb: 1,
            }}
          >
            <AutoAwesomeIcon sx={{ mr: 2, verticalAlign: "middle" }} />
            Parking Garage Management
          </Typography>
          <Typography variant="h6" color="text.secondary">
            Real-time garage status and vehicle management
          </Typography>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <Button
            variant="contained"
            onClick={() => setShowCheckInForm(true)}
            disabled={!hasAvailableLots}
            startIcon={<AddIcon />}
            sx={{
              background: hasAvailableLots
                ? "linear-gradient(45deg, #00ff88 30%, #00cc6a 90%)"
                : "linear-gradient(45deg, #666 30%, #444 90%)",
              "&:hover": {
                background: hasAvailableLots
                  ? "linear-gradient(45deg, #00cc6a 30%, #00ff88 90%)"
                  : "linear-gradient(45deg, #444 30%, #666 90%)",
              },
            }}
          >
            Check In Vehicle
          </Button>
          <Button
            variant="contained"
            onClick={() => setShowAsyncCheckIn(true)}
            disabled={!hasAvailableLots}
            startIcon={<CarIcon />}
            sx={{
              background: hasAvailableLots
                ? "linear-gradient(45deg, #2196f3 30%, #1976d2 90%)"
                : "linear-gradient(45deg, #666 30%, #444 90%)",
              color: "white",
              "&:hover": {
                background: hasAvailableLots
                  ? "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)"
                  : "linear-gradient(45deg, #444 30%, #666 90%)",
              },
            }}
          >
            {hasAvailableLots
              ? `Random Check-In (${maxRandomVehicles} vehicles)`
              : "Random Check-In"}
          </Button>
          <Button
            variant="outlined"
            onClick={loadGarageState}
            startIcon={
              isDataLoading ? <CircularProgress size={16} /> : <RefreshIcon />
            }
            disabled={isDataLoading}
            sx={{
              borderColor: "primary.main",
              color: "primary.main",
              "&:hover": {
                borderColor: "primary.light",
                backgroundColor: "rgba(0, 229, 255, 0.1)",
              },
            }}
          >
            Refresh
          </Button>
        </Stack>
      </Box>

      {/* Summary Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
          gap: 3,
        }}
      >
        <Card
          sx={{
            background:
              "linear-gradient(135deg, rgba(0, 229, 255, 0.1) 0%, rgba(0, 229, 255, 0.05) 100%)",
            border: "1px solid rgba(0, 229, 255, 0.2)",
            opacity: isDataLoading ? 0.7 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <ParkingIcon sx={{ mr: 1, color: "primary.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Total Lots
              </Typography>
            </Box>
            <Typography variant="h3" color="primary.main" fontWeight={700}>
              {totalLots}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            background:
              "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)",
            border: "1px solid rgba(33, 150, 243, 0.2)",
            opacity: isDataLoading ? 0.7 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <CarIcon sx={{ mr: 1, color: "info.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Occupied
              </Typography>
            </Box>
            <Typography variant="h3" color="info.main" fontWeight={700}>
              {occupiedLots}
            </Typography>
          </CardContent>
        </Card>
        <Card
          sx={{
            background:
              "linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)",
            border: "1px solid rgba(0, 255, 136, 0.2)",
            opacity: isDataLoading ? 0.7 : 1,
            transition: "opacity 0.2s ease-in-out",
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <MotorcycleIcon sx={{ mr: 1, color: "success.main" }} />
              <Typography variant="h6" fontWeight={600}>
                Available
              </Typography>
            </Box>
            <Typography variant="h3" color="success.main" fontWeight={700}>
              {totalLots - occupiedLots}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Main Table */}
      <Card>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography
              variant="h5"
              component="h3"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <ParkingIcon sx={{ mr: 1 }} />
              Parking Lots Status
            </Typography>
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              {isDataLoading && (
                <CircularProgress size={20} sx={{ color: "white" }} />
              )}
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
                  onChange={(e) => {
                    const newTicketType = e.target.value;
                    setFilters((prev) => ({
                      ...prev,
                      ticketType: newTicketType,
                    }));
                  }}
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
                  onChange={(e) => {
                    const newStatus = e.target.value;
                    setFilters((prev) => ({ ...prev, status: newStatus }));
                  }}
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
          </Box>

          <Box sx={{ position: "relative" }}>
            {isDataLoading && (
              <Box
                sx={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: "rgba(0, 0, 0, 0.1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  zIndex: 1,
                  borderRadius: 1,
                }}
              >
                <CircularProgress size={40} />
              </Box>
            )}
            <TableContainer
              component={Paper}
              sx={{
                backgroundColor: "transparent",
                boxShadow: "none",
                opacity: isDataLoading ? 0.7 : 1,
                transition: "opacity 0.2s ease-in-out",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.7 },
                        }}
                        onClick={() => handleSort("lotNumber")}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          Lot #
                        </Typography>
                        {sortConfig.key === "lotNumber" &&
                          (sortConfig.direction === "desc" ? (
                            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.7 },
                        }}
                        onClick={() => handleSort("ticketType")}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          Ticket Type
                        </Typography>
                        {sortConfig.key === "ticketType" &&
                          (sortConfig.direction === "desc" ? (
                            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.7 },
                        }}
                        onClick={() => handleSort("status")}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          Status
                        </Typography>
                        {sortConfig.key === "status" &&
                          (sortConfig.direction === "desc" ? (
                            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={700}>
                        Info
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.7 },
                        }}
                        onClick={() => handleSort("vehicleType")}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          Vehicle Type
                        </Typography>
                        {sortConfig.key === "vehicleType" &&
                          (sortConfig.direction === "desc" ? (
                            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: "pointer",
                          "&:hover": { opacity: 0.7 },
                        }}
                        onClick={() => handleSort("checkInTime")}
                      >
                        <Typography variant="subtitle2" fontWeight={700}>
                          Check-in Time
                        </Typography>
                        {sortConfig.key === "checkInTime" &&
                          (sortConfig.direction === "desc" ? (
                            <ArrowDownwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ) : (
                            <ArrowUpwardIcon sx={{ ml: 0.5, fontSize: 16 }} />
                          ))}
                      </Box>
                    </TableCell>
                    <TableCell align="center">
                      <Typography variant="subtitle2" fontWeight={700}>
                        Time Left
                      </Typography>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredLots.map((lot) => {
                    return (
                      <TableRow
                        key={lot.lotNumber}
                        hover
                        onClick={() => {
                          if (lot.status === 2 && lot.vehicle) {
                            setSelectedLot(lot);
                            setCheckOutLicensePlate(
                              lot.vehicle.licensePlate.value
                            );
                            setShowCheckOutDialog(true);
                          }
                        }}
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
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
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lot.vehicle.licensePlate.value}
                              </Typography>
                              <br />
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {lot.vehicle.height.toFixed(2)}m ×{" "}
                                {lot.vehicle.width.toFixed(2)}m ×{" "}
                                {lot.vehicle.length.toFixed(2)}m
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
                                {
                                  formatDateTimeSeparate(
                                    lot.vehicle.checkInTime
                                  ).date
                                }
                              </Typography>
                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {
                                  formatDateTimeSeparate(
                                    lot.vehicle.checkInTime
                                  ).time
                                }
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
                              <Typography
                                variant="body2"
                                color="text.secondary"
                              >
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
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </CardContent>
      </Card>

      {/* Modals */}
      {showCheckInForm && (
        <CheckInModal
          lots={lots}
          onClose={() => setShowCheckInForm(false)}
          onSuccess={(message, updateData) => {
            setShowCheckInForm(false);

            // Show toast with lot number if available
            const lotNumber = updateData?.updatedLot?.lotNumber;
            const toastMessage = lotNumber
              ? `${message} Assigned to Lot #${lotNumber}`
              : message;

            showToast(toastMessage, "success");

            // Update statistics from response
            if (updateData?.statistics) {
              setStatistics(updateData.statistics);
            }

            // Update the specific lot in the table if it matches current filters
            if (updateData?.updatedLot) {
              setLots((currentLots) => {
                const updatedLots = [...currentLots];
                const updatedLot = updateData.updatedLot!; // Safe to use ! here since we checked above
                const index = updatedLots.findIndex(
                  (lot) => lot.lotNumber === updatedLot.lotNumber
                );

                if (index !== -1) {
                  // Replace existing lot
                  updatedLots[index] = updatedLot;
                } else if (shouldShowLotInFilteredView(updatedLot)) {
                  // Add new lot if it matches current filters
                  updatedLots.push(updatedLot);
                }

                return updatedLots;
              });
            }
          }}
        />
      )}

      {showAsyncCheckIn && (
        <AsyncCheckInModal
          maxVehicles={maxRandomVehicles}
          onClose={() => setShowAsyncCheckIn(false)}
          onSuccess={(message, updateData) => {
            setShowAsyncCheckIn(false);

            // Show toast with lot information if available
            const lotCount = updateData?.updatedLots?.length || 0;
            const toastMessage =
              lotCount > 0
                ? `${message} (${lotCount} lot${
                    lotCount > 1 ? "s" : ""
                  } updated)`
                : message;

            showToast(toastMessage, "success");

            // Update statistics from response
            if (updateData?.statistics) {
              setStatistics(updateData.statistics);
            }

            // Update the specific lots in the table if they match current filters
            if (updateData?.updatedLots) {
              setLots((currentLots) => {
                const updatedLots = [...currentLots];
                const updatedLotsData = updateData.updatedLots!; // Safe to use ! here since we checked above

                updatedLotsData.forEach((updatedLot) => {
                  const index = updatedLots.findIndex(
                    (lot) => lot.lotNumber === updatedLot.lotNumber
                  );

                  if (index !== -1) {
                    // Replace existing lot
                    updatedLots[index] = updatedLot;
                  } else if (shouldShowLotInFilteredView(updatedLot)) {
                    // Add new lot if it matches current filters
                    updatedLots.push(updatedLot);
                  }
                });

                return updatedLots;
              });
            }
          }}
        />
      )}

      {/* Check Out Dialog */}
      {showCheckOutDialog && (
        <Dialog
          open={showCheckOutDialog}
          onClose={() => setShowCheckOutDialog(false)}
          maxWidth="sm"
          fullWidth
          PaperProps={{
            sx: {
              background:
                "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
              backdropFilter: "blur(20px)",
              border: "1px solid rgba(0, 229, 255, 0.3)",
            },
          }}
        >
          <DialogTitle
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="h4"
              component="div"
              sx={{ display: "flex", alignItems: "center" }}
            >
              <CarIcon sx={{ mr: 1 }} />
              Check Out Vehicle
            </Typography>
            <IconButton
              onClick={() => setShowCheckOutDialog(false)}
              sx={{ color: "text.secondary" }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mb: 3 }}>
                Check out vehicle from Lot #{selectedLot?.lotNumber}
              </Typography>
              <Box
                display="flex"
                gap={2}
                alignItems="end"
                sx={{ flexWrap: "wrap" }}
              >
                <TextField
                  fullWidth
                  label="License Plate ID"
                  value={checkOutLicensePlate}
                  onChange={(e) => setCheckOutLicensePlate(e.target.value)}
                  placeholder="Enter license plate number"
                  variant="outlined"
                  sx={{ minWidth: 300 }}
                />
                <Button
                  variant="contained"
                  onClick={handleCheckOut}
                  disabled={isCheckOutLoading || !checkOutLicensePlate.trim()}
                  sx={{
                    background:
                      "linear-gradient(45deg, #2196f3 30%, #1976d2 90%)",
                    color: "white",
                    "&:hover": {
                      background:
                        "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                    },
                    minWidth: 140,
                  }}
                >
                  {isCheckOutLoading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    "Check Out"
                  )}
                </Button>
              </Box>

              {checkOutResult && (
                <Alert
                  severity={checkOutResult.success ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {checkOutResult.message}
                </Alert>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

// Check In Modal Component
function CheckInModal({
  onClose,
  onSuccess,
  lots,
}: {
  onClose: () => void;
  onSuccess: (
    message: string,
    updateData?: {
      statistics: any;
      updatedLot?: ParkingLot;
      updatedLots?: ParkingLot[];
    }
  ) => void;
  lots: ParkingLot[];
}) {
  const [allAvailableLots, setAllAvailableLots] = useState<ParkingLot[]>([]);
  const [isLoadingAvailableLots, setIsLoadingAvailableLots] = useState(false);
  const [formData, setFormData] = useState<CheckInRequest>({
    name: "",
    licensePlate: "",
    phone: "",
    ticketType: "placeholder",
    vehicleType: "placeholder",
    height: 0,
    width: 0,
    length: 0,
  });

  // Fetch all available lots (not filtered) when modal opens
  useEffect(() => {
    const fetchAllAvailableLots = async () => {
      try {
        // Check if we already have all lot types in the current lots data
        const currentLotTypes = new Set(lots.map((lot) => lot.ticketType));
        const hasAllTypes =
          currentLotTypes.has(1) &&
          currentLotTypes.has(2) &&
          currentLotTypes.has(3);

        if (hasAllTypes) {
          // We already have all ticket types, use current data
          setAllAvailableLots(lots.filter((lot) => lot.status === 1));
        } else {
          // We need to fetch all lots to get complete data
          setIsLoadingAvailableLots(true);
          const garageState = await parkingApi.getGarageState(); // No filters = get all lots
          setAllAvailableLots(
            garageState.lots.filter((lot) => lot.status === 1)
          ); // Only available lots
        }
      } catch (error) {
        console.error("Error fetching all available lots:", error);
        // Fallback to current lots data
        setAllAvailableLots(lots.filter((lot) => lot.status === 1));
      } finally {
        setIsLoadingAvailableLots(false);
      }
    };

    fetchAllAvailableLots();
  }, [lots]); // Run when lots change (including when modal opens)
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    lotNumber?: number;
  } | null>(null);

  // Validate ticket type when form opens or allAvailableLots change
  useEffect(() => {
    if (
      formData.ticketType !== "placeholder" &&
      typeof formData.ticketType === "number"
    ) {
      const availableTypes = getAvailableTicketTypes(allAvailableLots);
      if (!availableTypes.has(formData.ticketType)) {
        // Current ticket type is not available, reset to placeholder
        setFormData((prev) => ({
          ...prev,
          ticketType: "placeholder",
          vehicleType: "placeholder",
        }));
      }
    }
  }, [allAvailableLots, formData.ticketType]);
  const [validationErrors, setValidationErrors] = useState<{
    name?: boolean;
    licensePlate?: boolean;
    phone?: boolean;
    ticketType?: boolean;
    vehicleType?: boolean;
    height?: boolean;
    width?: boolean;
    length?: boolean;
  }>({});
  const [serverErrorMessages, setServerErrorMessages] = useState<{
    name?: string;
    licensePlate?: string;
    phone?: string;
    ticketType?: string;
    vehicleType?: string;
    height?: string;
    width?: string;
    length?: string;
  }>({});
  const [upgradeInfo, setUpgradeInfo] = useState<{
    message: string;
    upgradeCost: number;
    suggestedTicketType?: TicketType;
  } | null>(null);

  // Get compatible vehicle types based on selected ticket type
  const getCompatibleVehicleTypes = (selectedTicketType: number) => {
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

  const getVehicleClass = (vehicleType: number) => {
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

  const isVehicleTypeCompatibleWithTicketType = (
    vehicleType: number,
    ticketType: number
  ) => {
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

  const selectedTicketType =
    typeof formData.ticketType === "string"
      ? parseInt(formData.ticketType) || 0
      : formData.ticketType || 0;
  const compatibleVehicleTypes = getCompatibleVehicleTypes(selectedTicketType);

  const vehicleTypeOptions = [
    {
      value: VehicleType.Motorcycle,
      label: "motorcycle",
      disabled: !compatibleVehicleTypes.has(VehicleType.Motorcycle),
    },
    {
      value: VehicleType.Private,
      label: "private",
      disabled: !compatibleVehicleTypes.has(VehicleType.Private),
    },
    {
      value: VehicleType.Crossover,
      label: "crossover",
      disabled: !compatibleVehicleTypes.has(VehicleType.Crossover),
    },
    {
      value: VehicleType.SUV,
      label: "suv",
      disabled: !compatibleVehicleTypes.has(VehicleType.SUV),
    },
    {
      value: VehicleType.Van,
      label: "van",
      disabled: !compatibleVehicleTypes.has(VehicleType.Van),
    },
    {
      value: VehicleType.Truck,
      label: "truck",
      disabled: !compatibleVehicleTypes.has(VehicleType.Truck),
    },
  ];

  // Calculate available ticket types based on current garage state
  const getAvailableTicketTypes = (lots: ParkingLot[]) => {
    const availableTypes = new Set<number>();
    lots.forEach((lot) => {
      if (lot.status === 1) {
        // Available lot
        availableTypes.add(lot.ticketType);
      }
    });
    return availableTypes;
  };

  const availableTicketTypes = getAvailableTicketTypes(allAvailableLots);

  const ticketTypeOptions = [
    {
      value: TicketType.VIP,
      label: "vip - $200 (Lots 1-10, All Classes)",
      disabled: !availableTicketTypes.has(TicketType.VIP),
    },
    {
      value: TicketType.Value,
      label: "value - $100 (Lots 11-30, Classes A&B)",
      disabled: !availableTicketTypes.has(TicketType.Value),
    },
    {
      value: TicketType.Regular,
      label: "regular - $50 (Lots 31-60, Class A)",
      disabled: !availableTicketTypes.has(TicketType.Regular),
    },
  ];

  const generateRandomData = async () => {
    try {
      setIsLoading(true);
      const randomData = await parkingApi.generateRandomData();

      // Check if the generated data is valid (not the "no available lots" case)
      if (
        (randomData.ticketType as any) === 0 ||
        (randomData.vehicleType as any) === 0
      ) {
        // No available lots - show error message
        setResult({
          success: false,
          message:
            "No available parking lots! Cannot generate random data. Please try again later or check out some vehicles first.",
        });
        return;
      }

      // Check if the generated ticket type is available
      if (
        typeof randomData.ticketType === "number" &&
        !availableTicketTypes.has(randomData.ticketType)
      ) {
        // Generated ticket type is not available - try to find an available one
        const availableTypes = Array.from(availableTicketTypes);
        if (availableTypes.length > 0) {
          // Use the first available ticket type
          randomData.ticketType = availableTypes[0];
          // Reset vehicle type to placeholder so user can select compatible one
          randomData.vehicleType = "placeholder";
        } else {
          setResult({
            success: false,
            message: "No available parking lots! Cannot generate random data.",
          });
          return;
        }
      }

      setFormData(randomData);

      // Clear all form errors and result when generating new data
      setValidationErrors({});
      setServerErrorMessages({});
      setResult(null); // Clear any previous error messages
      setUpgradeInfo(null); // Clear upgrade info
    } catch (error) {
      console.error("Failed to generate random data:", error);
      setResult({
        success: false,
        message: "Failed to generate random data. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeAccept = async () => {
    if (!upgradeInfo) return;

    try {
      setIsLoading(true);
      const response = await parkingApi.checkInVehicleWithUpgrade(
        formData as any
      );

      setUpgradeInfo(null); // Clear upgrade info

      // Close dialog immediately and show toast
      onSuccess(
        response.message || "Vehicle checked in successfully with upgrade!",
        {
          statistics: response.data?.statistics,
          updatedLot: response.data?.updatedLot,
        }
      );
    } catch (error: any) {
      console.error("Failed to check in with upgrade:", error);
      setResult({
        success: false,
        message:
          error.response?.data?.message || "Failed to check in with upgrade",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeReject = () => {
    setUpgradeInfo(null);
    setResult({
      success: false,
      message:
        "Check-in cancelled. Please adjust your vehicle details or select a different ticket type.",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult(null);

    // Clear all previous validation errors before running new validation
    setValidationErrors({});
    setServerErrorMessages({});

    // Validate required fields and set error states
    const errors = [];
    const newValidationErrors: typeof validationErrors = {};

    if (!formData.name.trim()) {
      errors.push("Name");
      newValidationErrors.name = true;
    }
    if (!formData.licensePlate.trim()) {
      errors.push("License Plate");
      newValidationErrors.licensePlate = true;
    }
    if (!formData.phone.trim()) {
      errors.push("Phone");
      newValidationErrors.phone = true;
    }
    if (formData.ticketType === "placeholder") {
      errors.push("Ticket Type");
      newValidationErrors.ticketType = true;
    }
    if (formData.vehicleType === "placeholder") {
      errors.push("Vehicle Type");
      newValidationErrors.vehicleType = true;
    }
    if (!formData.height || formData.height <= 0) {
      errors.push("Height");
      newValidationErrors.height = true;
    }
    if (!formData.width || formData.width <= 0) {
      errors.push("Width");
      newValidationErrors.width = true;
    }
    if (!formData.length || formData.length <= 0) {
      errors.push("Length");
      newValidationErrors.length = true;
    }

    if (errors.length > 0) {
      setValidationErrors(newValidationErrors);
      setResult({
        success: false,
        message: `Please fill in the following required fields: ${errors.join(
          ", "
        )}`,
      });
      setIsLoading(false);
      return;
    }

    try {
      const response = await parkingApi.checkInVehicle(formData as any);

      // Close dialog immediately and show toast
      onSuccess(response.message || "Vehicle checked in successfully!", {
        statistics: response.data?.statistics,
        updatedLot: response.data?.updatedLot,
      });
    } catch (error: any) {
      // Handle both upgrade requirements and other errors
      const errorData = error.response?.data;
      if (errorData?.data?.checkInResult?.requiresUpgrade) {
        // Show upgrade dialog instead of error message
        setUpgradeInfo({
          message: errorData.data.checkInResult.message || "Upgrade required",
          upgradeCost: errorData.data.checkInResult.upgradeCost || 0,
          suggestedTicketType: errorData.data.checkInResult.suggestedTicketType,
        });
        setResult(null); // Clear any previous result
      } else {
        // Handle server validation errors
        const serverErrors = errorData?.errors || {};
        const newValidationErrors: typeof validationErrors = {};
        const newServerErrorMessages: typeof serverErrorMessages = {};

        // Map server field errors to our validation state
        if (serverErrors["$.name"]) {
          newValidationErrors.name = true;
          newServerErrorMessages.name =
            serverErrors["$.name"][0] || "Name is invalid";
        }
        if (serverErrors["$.licensePlate"]) {
          newValidationErrors.licensePlate = true;
          newServerErrorMessages.licensePlate =
            serverErrors["$.licensePlate"][0] || "License Plate is invalid";
        }
        if (serverErrors["$.phone"]) {
          newValidationErrors.phone = true;
          newServerErrorMessages.phone =
            serverErrors["$.phone"][0] || "Phone is invalid";
        }
        if (serverErrors["$.ticketType"]) {
          newValidationErrors.ticketType = true;
          newServerErrorMessages.ticketType =
            serverErrors["$.ticketType"][0] || "Ticket Type is invalid";
        }
        if (serverErrors["$.vehicleType"]) {
          newValidationErrors.vehicleType = true;
          newServerErrorMessages.vehicleType =
            serverErrors["$.vehicleType"][0] || "Vehicle Type is invalid";
        }
        if (serverErrors["$.height"]) {
          newValidationErrors.height = true;
          newServerErrorMessages.height =
            serverErrors["$.height"][0] || "Height is invalid";
        }
        if (serverErrors["$.width"]) {
          newValidationErrors.width = true;
          newServerErrorMessages.width =
            serverErrors["$.width"][0] || "Width is invalid";
        }
        if (serverErrors["$.length"]) {
          newValidationErrors.length = true;
          newServerErrorMessages.length =
            serverErrors["$.length"][0] || "Length is invalid";
        }

        // Set validation errors if any
        if (Object.keys(newValidationErrors).length > 0) {
          setValidationErrors(newValidationErrors);
          setServerErrorMessages(newServerErrorMessages);
        }

        setResult({
          success: false,
          message: errorData?.message || "Failed to check in vehicle",
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    // For dimension fields, limit to 2 decimal places
    if (name === "height" || name === "width" || name === "length") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        const roundedValue = Math.round(numValue * 100) / 100; // Round to 2 decimal places
        setFormData((prev) => ({
          ...prev,
          [name]: roundedValue,
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }

    // Clear validation error when user starts typing
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }

    // Clear server error message when user starts typing
    if (serverErrorMessages[name as keyof typeof serverErrorMessages]) {
      setServerErrorMessages((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => {
      const newData = {
        ...prev,
        [name]: value,
      };

      // If ticket type changes, only reset vehicle type if it's not compatible
      if (name === "ticketType") {
        const selectedTicketType =
          typeof value === "string" ? parseInt(value) || 0 : value || 0;
        const currentVehicleType =
          typeof prev.vehicleType === "string"
            ? parseInt(prev.vehicleType) || 0
            : prev.vehicleType || 0;

        // Only reset if current vehicle type is not compatible with new ticket type
        if (
          currentVehicleType !== 0 &&
          !isVehicleTypeCompatibleWithTicketType(
            currentVehicleType,
            selectedTicketType
          )
        ) {
          newData.vehicleType = "placeholder";
        }
      }

      return newData;
    });

    // Clear validation error when user makes a selection
    if (validationErrors[name as keyof typeof validationErrors]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: false,
      }));
    }

    // Clear server error message when user makes a selection
    if (serverErrorMessages[name as keyof typeof serverErrorMessages]) {
      setServerErrorMessages((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background:
            "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(0, 229, 255, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          component="div"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <AddIcon sx={{ mr: 1 }} />
          Check In Vehicle
        </Typography>
        <IconButton onClick={onClose} sx={{ color: "text.secondary" }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
              gap: 3,
            }}
          >
            <TextField
              fullWidth
              label="Name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              variant="outlined"
              error={validationErrors.name}
              helperText={
                validationErrors.name
                  ? serverErrorMessages.name || "Name is required"
                  : ""
              }
            />

            <TextField
              fullWidth
              label="License Plate ID"
              name="licensePlate"
              value={formData.licensePlate}
              onChange={handleInputChange}
              variant="outlined"
              error={validationErrors.licensePlate}
              helperText={
                validationErrors.licensePlate
                  ? serverErrorMessages.licensePlate ||
                    "License Plate is required"
                  : ""
              }
            />

            <TextField
              fullWidth
              label="Phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              variant="outlined"
              error={validationErrors.phone}
              helperText={
                validationErrors.phone
                  ? serverErrorMessages.phone || "Phone is required"
                  : ""
              }
            />

            <FormControl fullWidth error={validationErrors.ticketType}>
              <InputLabel>Ticket Type</InputLabel>
              <Select
                name="ticketType"
                value={formData.ticketType}
                onChange={(e) =>
                  handleSelectChange("ticketType", e.target.value)
                }
                label="Ticket Type"
                variant="outlined"
                disabled={isLoadingAvailableLots}
                renderValue={(selected) => {
                  if (selected === "placeholder") {
                    return (
                      <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        Select Ticket Type
                      </span>
                    );
                  }
                  const option = ticketTypeOptions.find(
                    (opt) => opt.value === selected
                  );
                  return option ? option.label : selected;
                }}
              >
                {isLoadingAvailableLots ? (
                  <MenuItem disabled>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <span>Loading ticket types...</span>
                    </Box>
                  </MenuItem>
                ) : (
                  ticketTypeOptions.map((option) => (
                    <MenuItem
                      key={option.value}
                      value={option.value}
                      disabled={option.disabled}
                      sx={{
                        opacity: option.disabled ? 0.5 : 1,
                        color: option.disabled
                          ? "text.disabled"
                          : "text.primary",
                      }}
                    >
                      {option.label}
                    </MenuItem>
                  ))
                )}
              </Select>
              {validationErrors.ticketType && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {serverErrorMessages.ticketType || "Ticket Type is required"}
                </Typography>
              )}
            </FormControl>

            <FormControl fullWidth error={validationErrors.vehicleType}>
              <InputLabel>Vehicle Type</InputLabel>
              <Select
                name="vehicleType"
                value={formData.vehicleType}
                onChange={(e) =>
                  handleSelectChange("vehicleType", e.target.value)
                }
                label="Vehicle Type"
                variant="outlined"
                renderValue={(selected) => {
                  if (selected === "placeholder") {
                    return (
                      <span style={{ color: "rgba(255, 255, 255, 0.6)" }}>
                        Select Vehicle Type
                      </span>
                    );
                  }
                  const option = vehicleTypeOptions.find(
                    (opt) => opt.value === selected
                  );
                  return option ? option.label : selected;
                }}
              >
                {vehicleTypeOptions.map((option) => (
                  <MenuItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled}
                    sx={{
                      opacity: option.disabled ? 0.5 : 1,
                      color: option.disabled ? "text.disabled" : "text.primary",
                    }}
                  >
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {validationErrors.vehicleType && (
                <Typography
                  variant="caption"
                  color="error"
                  sx={{ mt: 0.5, ml: 1.75 }}
                >
                  {serverErrorMessages.vehicleType ||
                    "Vehicle Type is required"}
                </Typography>
              )}
            </FormControl>
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
              gap: 3,
              mt: 3,
            }}
          >
            <TextField
              fullWidth
              label="Height (m)"
              name="height"
              type="number"
              value={formData.height}
              onChange={handleInputChange}
              inputProps={{
                min: 0,
                step: 0.01,
                max: 999.99,
              }}
              variant="outlined"
              error={validationErrors.height}
              helperText={
                validationErrors.height
                  ? serverErrorMessages.height ||
                    "Height must be greater than 0"
                  : ""
              }
              FormHelperTextProps={{
                sx: {
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  color: "text.secondary",
                },
              }}
            />

            <TextField
              fullWidth
              label="Width (m)"
              name="width"
              type="number"
              value={formData.width}
              onChange={handleInputChange}
              inputProps={{
                min: 0,
                step: 0.01,
                max: 999.99,
              }}
              variant="outlined"
              error={validationErrors.width}
              helperText={
                validationErrors.width
                  ? serverErrorMessages.width || "Width must be greater than 0"
                  : ""
              }
              FormHelperTextProps={{
                sx: {
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  color: "text.secondary",
                },
              }}
            />

            <TextField
              fullWidth
              label="Length (m)"
              name="length"
              type="number"
              value={formData.length}
              onChange={handleInputChange}
              inputProps={{
                min: 0,
                step: 0.01,
                max: 999.99,
              }}
              variant="outlined"
              error={validationErrors.length}
              helperText={
                validationErrors.length
                  ? serverErrorMessages.length ||
                    "Length must be greater than 0"
                  : ""
              }
              FormHelperTextProps={{
                sx: {
                  fontSize: "0.75rem",
                  marginTop: "4px",
                  color: "text.secondary",
                },
              }}
            />
          </Box>

          {upgradeInfo && (
            <Alert severity="warning" sx={{ mt: 3 }}>
              <Typography variant="body1" sx={{ mb: 2 }}>
                {upgradeInfo.message}
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, fontWeight: 600 }}>
                Additional cost: ${upgradeInfo.upgradeCost.toFixed(2)}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, mt: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpgradeAccept}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                >
                  Accept Upgrade
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={handleUpgradeReject}
                  disabled={isLoading}
                  sx={{ flex: 1 }}
                >
                  Cancel
                </Button>
              </Box>
            </Alert>
          )}

          {result && !result.success && (
            <Alert severity="error" sx={{ mt: 3 }}>
              <Typography variant="body1">{result.message}</Typography>
            </Alert>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3, justifyContent: "space-between" }}>
        <Button
          variant="outlined"
          onClick={generateRandomData}
          disabled={availableTicketTypes.size === 0 || isLoading}
          startIcon={
            isLoading ? <CircularProgress size={16} /> : <AutoAwesomeIcon />
          }
          sx={{
            borderColor: "secondary.main",
            color: "secondary.main",
            "&:hover": {
              borderColor: "secondary.light",
              backgroundColor: "rgba(255, 64, 129, 0.1)",
            },
            "&:disabled": {
              borderColor: "text.disabled",
              color: "text.disabled",
            },
          }}
        >
          Generate Random Data
        </Button>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button
            onClick={onClose}
            variant="outlined"
            sx={{
              borderColor: "text.secondary",
              color: "text.secondary",
              "&:hover": {
                borderColor: "text.primary",
                backgroundColor: "rgba(255, 255, 255, 0.1)",
              },
            }}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={isLoading}
            onClick={handleSubmit}
            sx={{
              background: "linear-gradient(45deg, #00ff88 30%, #00cc6a 90%)",
              "&:hover": {
                background: "linear-gradient(45deg, #00cc6a 30%, #00ff88 90%)",
              },
            }}
          >
            {isLoading ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CircularProgress size={20} color="inherit" />
                Processing...
              </Box>
            ) : (
              "Check In"
            )}
          </Button>
        </Box>
      </DialogActions>
    </Dialog>
  );
}

// Async Check In Modal Component
function AsyncCheckInModal({
  maxVehicles,
  onClose,
  onSuccess,
}: {
  maxVehicles: number;
  onClose: () => void;
  onSuccess: (
    message: string,
    updateData?: {
      statistics: any;
      updatedLot?: ParkingLot;
      updatedLots?: ParkingLot[];
    }
  ) => void;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { showToast } = useToast();

  const handleAsyncCheckIn = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await parkingApi.asyncCheckInVehicles(maxVehicles);
      setResult({
        totalProcessed: response.totalProcessed,
        successful: response.successful,
        failed: response.failed,
        statistics: response.statistics,
        updatedLots: response.updatedLots,
      });

      // Show success toast with detailed information
      const successCount = response.successful || 0;
      const totalCount = response.totalProcessed || 0;
      const failedCount = response.failed || 0;

      if (successCount > 0) {
        // Don't call onSuccess here - let user review results first
        // The results will be processed when user closes the modal
      } else if (failedCount > 0) {
        // Check if the failure is due to no available lots
        if (response.successful === 0 && response.failed > 0) {
          showToast(
            "The garage is full! No available parking lots for new vehicles.",
            "warning"
          );
        } else {
          showToast(
            `Failed to check in any vehicles. All ${failedCount} attempts failed.`,
            "error"
          );
        }
      } else {
        showToast("Async check-in completed", "info");
      }

      // Don't auto-close, let user review results and close manually
    } catch (error: any) {
      console.error("Async check-in failed:", error);

      // Show detailed error toast
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Failed to process async check-in";

      showToast(`Async check-in failed: ${errorMessage}`, "error");

      setResult({
        totalProcessed: 5,
        successful: 0,
        failed: 5,
        statistics: null,
        updatedLots: [],
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog
      open={true}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          background:
            "linear-gradient(135deg, rgba(26, 26, 26, 0.95) 0%, rgba(10, 10, 10, 0.95) 100%)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 64, 129, 0.3)",
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Typography
          variant="h4"
          component="div"
          sx={{ display: "flex", alignItems: "center" }}
        >
          <CarIcon sx={{ mr: 1 }} />
          Random Check-In ({maxVehicles} Vehicles)
        </Typography>
        <IconButton
          onClick={() => {
            // Update UI with results if they exist
            if (result) {
              const successCount = result?.successful || 0;
              const totalCount = result?.totalProcessed || 0;
              const failedCount = result?.failed || 0;

              let message = "Async check-in completed";
              if (successCount > 0 && failedCount === 0) {
                message = `Successfully checked in all ${successCount} vehicles!`;
              } else if (successCount > 0 && failedCount > 0) {
                message = `Successfully checked in ${successCount} out of ${totalCount} vehicles (${failedCount} failed)`;
              } else if (failedCount > 0) {
                message = `Failed to check in any vehicles. All ${failedCount} attempts failed.`;
              }

              // Show toast with lot information
              const lotCount = result?.updatedLots?.length || 0;
              const toastMessage =
                lotCount > 0
                  ? `${message} (${lotCount} lot${
                      lotCount > 1 ? "s" : ""
                    } updated)`
                  : message;

              showToast(toastMessage, "success");

              // Pass the update data for table updates
              onSuccess(message, {
                statistics: result?.statistics,
                updatedLots: result?.updatedLots,
              });
            }
            onClose();
          }}
          sx={{ color: "text.secondary" }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {!result ? (
          <Box textAlign="center" sx={{ py: 4 }}>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              This will check in {maxVehicles} randomly generated vehicles.
            </Typography>
            <Button
              variant="contained"
              onClick={handleAsyncCheckIn}
              disabled={isLoading}
              size="large"
              sx={{
                background: "linear-gradient(45deg, #2196f3 30%, #1976d2 90%)",
                "&:hover": {
                  background:
                    "linear-gradient(45deg, #1976d2 30%, #2196f3 90%)",
                },
              }}
            >
              {isLoading ? (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CircularProgress size={20} color="inherit" />
                  Processing...
                </Box>
              ) : (
                "Start Random Check-In"
              )}
            </Button>
          </Box>
        ) : (
          <Box sx={{ py: 2 }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                gap: 3,
                mb: 4,
              }}
            >
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)",
                  border: "1px solid rgba(33, 150, 243, 0.2)",
                  textAlign: "center",
                }}
              >
                <CardContent>
                  <Typography variant="h3" color="info.main" fontWeight={700}>
                    {result?.totalProcessed || 0}
                  </Typography>
                  <Typography variant="body2" color="info.main">
                    Total Processed
                  </Typography>
                </CardContent>
              </Card>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)",
                  border: "1px solid rgba(0, 255, 136, 0.2)",
                  textAlign: "center",
                }}
              >
                <CardContent>
                  <Typography
                    variant="h3"
                    color="success.main"
                    fontWeight={700}
                  >
                    {result?.successful || 0}
                  </Typography>
                  <Typography variant="body2" color="success.main">
                    Successful
                  </Typography>
                </CardContent>
              </Card>
              <Card
                sx={{
                  background:
                    "linear-gradient(135deg, rgba(255, 107, 53, 0.1) 0%, rgba(255, 107, 53, 0.05) 100%)",
                  border: "1px solid rgba(255, 107, 53, 0.2)",
                  textAlign: "center",
                }}
              >
                <CardContent>
                  <Typography variant="h3" color="error.main" fontWeight={700}>
                    {result?.failed || 0}
                  </Typography>
                  <Typography variant="body2" color="error.main">
                    Failed
                  </Typography>
                </CardContent>
              </Card>
            </Box>

            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Successfully Checked-In Vehicles:
              </Typography>
              <Stack spacing={2}>
                {result.updatedLots?.map((lot: ParkingLot, index: number) => (
                  <Card
                    key={index}
                    sx={{
                      background:
                        "linear-gradient(135deg, rgba(0, 255, 136, 0.1) 0%, rgba(0, 255, 136, 0.05) 100%)",
                      border: "1px solid rgba(0, 255, 136, 0.2)",
                    }}
                  >
                    <CardContent sx={{ py: 2 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mb={2}
                      >
                        <Typography variant="body1" fontWeight={600}>
                          {lot.vehicle?.licensePlate?.value || "N/A"}
                        </Typography>
                        <Chip
                          label="Success"
                          color="success"
                          size="small"
                          sx={{ fontWeight: 600 }}
                        />
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Name
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {lot.vehicle?.name || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Phone
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {lot.vehicle?.phone || "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Ticket Type
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {getTicketTypeText(lot.vehicle?.ticketType) ||
                              "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Vehicle Type
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {getVehicleTypeText(lot.vehicle?.vehicleType) ||
                              "N/A"}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: 1,
                          mb: 2,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Height (m)
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {lot.vehicle?.height
                              ? `${lot.vehicle.height.toFixed(2)}m`
                              : "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Width (m)
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {lot.vehicle?.width
                              ? `${lot.vehicle.width.toFixed(2)}m`
                              : "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            display="block"
                          >
                            Length (m)
                          </Typography>
                          <Typography variant="body2" fontWeight={500}>
                            {lot.vehicle?.length
                              ? `${lot.vehicle.length.toFixed(2)}m`
                              : "N/A"}
                          </Typography>
                        </Box>
                      </Box>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        Vehicle checked in successfully
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Lot #{lot.lotNumber}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Stack>
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button
          onClick={() => {
            // Update UI with results if they exist
            if (result) {
              const successCount = result?.successful || 0;
              const totalCount = result?.totalProcessed || 0;
              const failedCount = result?.failed || 0;

              let message = "Async check-in completed";
              if (successCount > 0 && failedCount === 0) {
                message = `Successfully checked in all ${successCount} vehicles!`;
              } else if (successCount > 0 && failedCount > 0) {
                message = `Successfully checked in ${successCount} out of ${totalCount} vehicles (${failedCount} failed)`;
              } else if (failedCount > 0) {
                message = `Failed to check in any vehicles. All ${failedCount} attempts failed.`;
              }

              // Show toast with lot information
              const lotCount = result?.updatedLots?.length || 0;
              const toastMessage =
                lotCount > 0
                  ? `${message} (${lotCount} lot${
                      lotCount > 1 ? "s" : ""
                    } updated)`
                  : message;

              showToast(toastMessage, "success");

              // Pass the update data for table updates
              onSuccess(message, {
                statistics: result?.statistics,
                updatedLots: result?.updatedLots,
              });
            }
            onClose();
          }}
          variant="contained"
          sx={{
            background: "linear-gradient(45deg, #666 30%, #444 90%)",
            "&:hover": {
              background: "linear-gradient(45deg, #444 30%, #666 90%)",
            },
          }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
