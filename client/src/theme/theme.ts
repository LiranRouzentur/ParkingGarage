import { createTheme } from "@mui/material/styles";

export const futuristicDarkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#00e5ff", // Cyan blue
      light: "#64f5ff",
      dark: "#00b2cc",
      contrastText: "#000000",
    },
    secondary: {
      main: "#ff4081", // Pink accent
      light: "#ff79b0",
      dark: "#c60055",
      contrastText: "#ffffff",
    },
    background: {
      default: "#0a0a0a", // Very dark background
      paper: "#1a1a1a", // Dark paper
    },
    text: {
      primary: "#ffffff",
      secondary: "#b0b0b0",
    },
    success: {
      main: "#00ff88", // Bright green
      light: "#5cffb3",
      dark: "#00cc6a",
    },
    warning: {
      main: "#ffaa00", // Orange
      light: "#ffcc4d",
      dark: "#cc8800",
    },
    error: {
      main: "#ff6b35", // Orange instead of red
      light: "#ff8a65",
      dark: "#e64a19",
    },
    info: {
      main: "#2196f3", // Blue
      light: "#64b5f6",
      dark: "#1976d2",
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    h3: {
      fontSize: "1.5rem",
      fontWeight: 600,
    },
    h4: {
      fontSize: "1.25rem",
      fontWeight: 500,
    },
    h5: {
      fontSize: "1.125rem",
      fontWeight: 500,
    },
    h6: {
      fontSize: "1rem",
      fontWeight: 500,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: 1.5,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.43,
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%)",
          minHeight: "100vh",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "rgba(26, 26, 26, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(0, 229, 255, 0.2)",
          boxShadow: "0 8px 32px rgba(0, 229, 255, 0.1)",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: 8,
          fontWeight: 600,
          boxShadow: "0 4px 14px 0 rgba(0, 229, 255, 0.2)",
          "&:hover": {
            boxShadow: "0 6px 20px 0 rgba(0, 229, 255, 0.3)",
            transform: "translateY(-2px)",
          },
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        },
        contained: {
          background: "linear-gradient(45deg, #00e5ff 30%, #00b2cc 90%)",
          "&:hover": {
            background: "linear-gradient(45deg, #00b2cc 30%, #00e5ff 90%)",
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(0, 229, 255, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 229, 255, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00e5ff",
              boxShadow: "0 0 0 2px rgba(0, 229, 255, 0.2)",
            },
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 229, 255, 0.3)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(0, 229, 255, 0.5)",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#00e5ff",
            boxShadow: "0 0 0 2px rgba(0, 229, 255, 0.2)",
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            "& fieldset": {
              borderColor: "rgba(0, 229, 255, 0.3)",
            },
            "&:hover fieldset": {
              borderColor: "rgba(0, 229, 255, 0.5)",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#00e5ff",
              boxShadow: "0 0 0 2px rgba(0, 229, 255, 0.2)",
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 600,
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          "& .MuiTableCell-head": {
            backgroundColor: "rgba(0, 229, 255, 0.1)",
            color: "#00e5ff",
            fontWeight: 700,
            fontSize: "0.875rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          },
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:nth-of-type(even)": {
            backgroundColor: "rgba(0, 229, 255, 0.02)",
          },
          "&:hover": {
            backgroundColor: "rgba(0, 229, 255, 0.08)",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0, 229, 255, 0.1)",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          backgroundColor: "rgba(26, 26, 26, 0.8)",
          backdropFilter: "blur(10px)",
        },
      },
    },
  },
});
