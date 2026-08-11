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
      error: { main: designTokens.colors.error },
      warning: { main: designTokens.colors.warning },
      success: { main: designTokens.colors.success },
    },
    typography: designTokens.typography,
    spacing: designTokens.spacing,
    breakpoints: { values: designTokens.breakpoints },
  });
}
