import React, { useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  Chip,
  Stack,
  CircularProgress,
} from "@mui/material";
import {
  DirectionsCar as CarIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { ParkingLot } from "../types";
import { parkingApi } from "../services/api";
import { useToast } from "../contexts/ToastContext";
import { getTicketTypeText, getVehicleTypeText } from "../utils/enumUtils";

interface AsyncCheckInModalProps {
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
}

/**
 * Modal component for async check-in of random vehicles
 * Implements PRD requirements for bulk vehicle processing
 */
export const AsyncCheckInModal: React.FC<AsyncCheckInModalProps> = ({
  maxVehicles,
  onClose,
  onSuccess,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { showToast } = useToast();

  const handleAsyncCheckIn = useCallback(async () => {
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
  }, [maxVehicles, showToast]);

  const handleClose = useCallback(() => {
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
          ? `${message} (${lotCount} lot${lotCount > 1 ? "s" : ""} updated)`
          : message;

      showToast(toastMessage, "success");

      // Pass the update data for table updates
      onSuccess(message, {
        statistics: result?.statistics,
        updatedLots: result?.updatedLots,
      });
    }
    onClose();
  }, [result, showToast, onSuccess, onClose]);

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
        <IconButton onClick={handleClose} sx={{ color: "text.secondary" }}>
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
          onClick={handleClose}
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
};
