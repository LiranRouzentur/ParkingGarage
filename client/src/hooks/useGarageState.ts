import { useState, useCallback, useEffect } from "react";
import { ParkingLot, GarageStatistics } from "../types";
import { parkingApi } from "../services/api";

interface UseGarageStateProps {
  filters: {
    ticketType: string;
    status: string;
  };
}

interface SortConfig {
  key: string;
  direction: "asc" | "desc";
}

/**
 * Custom hook for managing garage state, loading, and sorting
 * Implements PRD requirements for garage state management
 */
export const useGarageState = ({ filters }: UseGarageStateProps) => {
  const [lots, setLots] = useState<ParkingLot[]>([]);
  const [statistics, setStatistics] = useState<GarageStatistics | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "checkInTime",
    direction: "desc",
  });

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

  const handleSort = useCallback((key: string) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "desc"
          ? "asc"
          : "desc",
    }));
  }, []);

  const sortLots = useCallback(
    (lots: ParkingLot[]) => {
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
    },
    [sortConfig]
  );

  const updateLot = useCallback((updatedLot: ParkingLot) => {
    setLots((currentLots) => {
      const updatedLots = [...currentLots];
      const index = updatedLots.findIndex(
        (lot) => lot.lotNumber === updatedLot.lotNumber
      );

      if (index !== -1) {
        updatedLots[index] = updatedLot;
      } else {
        updatedLots.push(updatedLot);
      }

      return updatedLots;
    });
  }, []);

  const updateLots = useCallback((updatedLots: ParkingLot[]) => {
    setLots((currentLots) => {
      const newLots = [...currentLots];

      updatedLots.forEach((updatedLot) => {
        const index = newLots.findIndex(
          (lot) => lot.lotNumber === updatedLot.lotNumber
        );

        if (index !== -1) {
          newLots[index] = updatedLot;
        } else {
          newLots.push(updatedLot);
        }
      });

      return newLots;
    });
  }, []);

  const updateStatistics = useCallback((newStatistics: any) => {
    setStatistics(newStatistics);
  }, []);

  return {
    lots,
    statistics,
    isInitialLoading,
    isDataLoading,
    sortConfig,
    loadGarageState,
    handleSort,
    sortLots,
    updateLot,
    updateLots,
    updateStatistics,
  };
};
