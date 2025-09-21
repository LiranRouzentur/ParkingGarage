import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from "@mui/material";
import {
  LocalParking as ParkingIcon,
  DirectionsCar as CarIcon,
  TwoWheeler as MotorcycleIcon,
} from "@mui/icons-material";
import { GarageStatistics } from "../types";

interface GarageStatisticsCardsProps {
  statistics: GarageStatistics | null;
  isDataLoading: boolean;
}

/**
 * Component for displaying garage statistics cards
 * Shows total lots, occupied, and available counts as per PRD requirements
 */
export const GarageStatisticsCards: React.FC<GarageStatisticsCardsProps> = ({
  statistics,
  isDataLoading,
}) => {
  const occupiedLots = statistics?.occupiedLots ?? 0;
  const totalLots = statistics?.totalLots ?? 0;

  return (
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
  );
};
