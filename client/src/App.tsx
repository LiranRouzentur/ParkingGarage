import React from "react";
import { ThemeProvider, CssBaseline, Container, Box } from "@mui/material";
import { futuristicDarkTheme } from "./theme/theme";
import { ParkingGarageTable } from "./components/ParkingGarageTable";
import { ToastProvider } from "./contexts/ToastContext";

function App() {
  return (
    <ThemeProvider theme={futuristicDarkTheme}>
      <CssBaseline />
      <ToastProvider>
        <Box
          sx={{
            minHeight: "100vh",
            background:
              "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%)",
            position: "relative",
            "&::before": {
              content: '""',
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: `
                radial-gradient(circle at 20% 80%, rgba(0, 229, 255, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 80% 20%, rgba(255, 64, 129, 0.1) 0%, transparent 50%),
                radial-gradient(circle at 40% 40%, rgba(0, 255, 136, 0.05) 0%, transparent 50%)
              `,
              pointerEvents: "none",
            },
          }}
        >
          <Container
            maxWidth="xl"
            sx={{ position: "relative", zIndex: 1, py: 4 }}
          >
            <ParkingGarageTable />
          </Container>
        </Box>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
