import { createTheme } from "@mui/material/styles";
import type { Direction } from "@mui/material/styles";
import { designTokens } from "./tokens";

export function createAppTheme(direction: Direction) {
  return createTheme({
    direction,
    palette: {
      mode: "light",
      primary: { main: designTokens.colors.primary },
      secondary: { main: designTokens.colors.secondary },
      background: {
        default: designTokens.colors.background,
        paper: designTokens.colors.surface,
      },
      text: {
        primary: designTokens.colors.textPrimary,
        secondary: designTokens.colors.textSecondary,
      },
      divider: designTokens.colors.border,
      error: { main: designTokens.colors.error },
      warning: { main: designTokens.colors.warning },
      success: { main: designTokens.colors.success },
    },
    typography: {
      ...designTokens.typography,
      h4: { fontSize: "1.75rem", lineHeight: 1.3, fontWeight: 700 },
      h5: { fontSize: "1.25rem", lineHeight: 1.4, fontWeight: 700 },
      h6: { fontSize: "0.875rem", lineHeight: 1.45, fontWeight: 700 },
      body1: { fontSize: "0.875rem", lineHeight: 1.55 },
      body2: { fontSize: "0.8125rem", lineHeight: 1.5 },
      caption: { fontSize: "0.75rem", lineHeight: 1.5, fontWeight: 500 },
      button: { fontWeight: 700, textTransform: "none" },
    },
    spacing: designTokens.spacing,
    breakpoints: { values: designTokens.breakpoints },
    shape: { borderRadius: 12 },
    components: {
      MuiButton: {
        styleOverrides: { root: { minHeight: 44, borderRadius: 9 } },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
    },
  });
}
