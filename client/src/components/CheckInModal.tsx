import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  IconButton,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import {
  Add as AddIcon,
  Close as CloseIcon,
  AutoAwesome as AutoAwesomeIcon,
} from "@mui/icons-material";
import { CheckInRequest, ParkingLot, VehicleType, TicketType } from "../types";
import { parkingApi } from "../services/api";
import { convertRequestForApi } from "../utils/enumUtils";
import {
  validateCheckInForm,
  parseServerValidationErrors,
} from "../utils/validationUtils";
import {
  getCompatibleVehicleTypes,
  getAvailableTicketTypes,
  isVehicleTypeCompatibleWithTicketType,
} from "../utils/businessLogicUtils";

interface CheckInModalProps {
  lots: ParkingLot[];
  onClose: () => void;
  onSuccess: (
    message: string,
    updateData?: {
      statistics: any;
      updatedLot?: ParkingLot;
      updatedLots?: ParkingLot[];
    }
  ) => void;
}

/**
 * Modal component for vehicle check-in
 * Implements PRD requirements for vehicle registration and validation
 */
export const CheckInModal: React.FC<CheckInModalProps> = ({
  lots,
  onClose,
  onSuccess,
}) => {
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
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    lotNumber?: number;
  } | null>(null);
  const [validationErrors, setValidationErrors] = useState<any>({});
  const [serverErrorMessages, setServerErrorMessages] = useState<any>({});
  const [upgradeInfo, setUpgradeInfo] = useState<{
    message: string;
    upgradeCost: number;
    suggestedTicketType?: TicketType;
  } | null>(null);

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
  }, [lots]);

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

  const generateRandomData = useCallback(async () => {
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
  }, [availableTicketTypes]);

  const handleUpgradeAccept = useCallback(async () => {
    if (!upgradeInfo) return;

    try {
      setIsLoading(true);
      const response = await parkingApi.checkInVehicleWithUpgrade(
        convertRequestForApi(formData)
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
  }, [upgradeInfo, formData, onSuccess]);

  const handleUpgradeReject = useCallback(() => {
    setUpgradeInfo(null);
    setResult({
      success: false,
      message:
        "Check-in cancelled. Please adjust your vehicle details or select a different ticket type.",
    });
  }, []);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setIsLoading(true);
      setResult(null);

      // Clear all previous validation errors before running new validation
      setValidationErrors({});
      setServerErrorMessages({});

      // Validate required fields and set error states
      const { errors, validationErrors: newValidationErrors } =
        validateCheckInForm(formData);

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
        const response = await parkingApi.checkInVehicle(
          convertRequestForApi(formData)
        );

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
            suggestedTicketType:
              errorData.data.checkInResult.suggestedTicketType,
          });
          setResult(null); // Clear any previous result
        } else {
          // Handle server validation errors
          const serverErrors = errorData?.errors || {};
          const {
            validationErrors: parsedValidationErrors,
            serverErrorMessages: parsedServerErrorMessages,
          } = parseServerValidationErrors(serverErrors);

          // Set validation errors if any
          if (Object.keys(parsedValidationErrors).length > 0) {
            setValidationErrors(parsedValidationErrors);
            setServerErrorMessages(parsedServerErrorMessages);
          }

          setResult({
            success: false,
            message: errorData?.message || "Failed to check in vehicle",
          });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [formData, onSuccess]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        setValidationErrors((prev: { [key: string]: boolean }) => ({
          ...prev,
          [name]: false,
        }));
      }

      // Clear server error message when user starts typing
      if (serverErrorMessages[name as keyof typeof serverErrorMessages]) {
        setServerErrorMessages(
          (prev: { [key: string]: string | undefined }) => ({
            ...prev,
            [name]: undefined,
          })
        );
      }
    },
    [validationErrors, serverErrorMessages]
  );

  const handleSelectChange = useCallback(
    (name: string, value: any) => {
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
        setValidationErrors((prev: { [key: string]: boolean }) => ({
          ...prev,
          [name]: false,
        }));
      }

      // Clear server error message when user makes a selection
      if (serverErrorMessages[name as keyof typeof serverErrorMessages]) {
        setServerErrorMessages(
          (prev: { [key: string]: string | undefined }) => ({
            ...prev,
            [name]: undefined,
          })
        );
      }
    },
    [validationErrors, serverErrorMessages]
  );

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
};
