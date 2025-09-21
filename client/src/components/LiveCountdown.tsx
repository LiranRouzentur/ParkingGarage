import React, { useState, useEffect } from "react";
import { Typography } from "@mui/material";

interface LiveCountdownProps {
  checkInTime: string;
  ticketType: string;
}

export const LiveCountdown: React.FC<LiveCountdownProps> = ({
  checkInTime,
  ticketType,
}) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    // For VIP tickets, don't show any countdown
    if (ticketType === "1") {
      // VIP = 1
      setTimeLeft("");
      return;
    }

    const updateTimeLeft = () => {
      const now = new Date();
      // Parse check-in time - backend sends ISO format
      const checkIn = new Date(checkInTime);

      // Get time limits in milliseconds
      const timeLimitMs =
        ticketType === "2" // Value = 2
          ? 72 * 60 * 60 * 1000 // 72 hours for Value
          : 24 * 60 * 60 * 1000; // 24 hours for Regular (ticketType = "3")

      // Calculate expiration time (check-in time + time limit)
      const expirationTime = new Date(checkIn.getTime() + timeLimitMs);

      // Calculate time until expiration
      const timeUntilExpirationMs = expirationTime.getTime() - now.getTime();

      // If time limit exceeded, show "Expired"
      if (timeUntilExpirationMs <= 0) {
        setTimeLeft("Expired");
        return;
      }

      // Calculate time until expiration components
      const remainingDays = Math.floor(
        timeUntilExpirationMs / (1000 * 60 * 60 * 24)
      );
      const remainingHours = Math.floor(
        (timeUntilExpirationMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const remainingMinutes = Math.floor(
        (timeUntilExpirationMs % (1000 * 60 * 60)) / (1000 * 60)
      );
      const remainingSeconds = Math.floor(
        (timeUntilExpirationMs % (1000 * 60)) / 1000
      );

      // Format based on remaining time
      const hours = remainingHours.toString().padStart(2, "0");
      const minutes = remainingMinutes.toString().padStart(2, "0");
      const seconds = remainingSeconds.toString().padStart(2, "0");

      if (remainingDays > 0) {
        // More than one day: "Dd HH:MM:SS"
        setTimeLeft(`${remainingDays}d ${hours}:${minutes}:${seconds}`);
      } else {
        // Less than one day: "HH:MM:SS"
        setTimeLeft(`${hours}:${minutes}:${seconds}`);
      }
    };

    // Update immediately
    updateTimeLeft();

    // Update every second
    const interval = setInterval(updateTimeLeft, 1000);

    return () => clearInterval(interval);
  }, [checkInTime, ticketType]);

  const getColor = () => {
    if (ticketType === "1") {
      // VIP = 1
      return "text.secondary"; // Gray for empty VIP cells
    }
    if (timeLeft === "Expired") {
      return "error.main"; // Red for "Expired"
    }
    return "primary.main"; // Blue for countdown
  };

  return (
    <Typography
      variant="body2"
      color={getColor()}
      fontWeight={600}
      sx={{
        fontFamily: "monospace",
        fontSize: "0.875rem",
      }}
    >
      {timeLeft}
    </Typography>
  );
};
