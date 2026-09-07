import { createTheme } from "@mui/material/styles";
import type { Direction, PaletteMode } from "@mui/material/styles";
import { designTokens } from "./tokens";

export function createAppTheme(
  direction: Direction,
  mode: PaletteMode = "light",
) {
  const dark = mode === "dark";
  const colors = dark ? designTokens.darkColors : designTokens.colors;

  return createTheme({
    direction,
    palette: {
      mode,
      primary: { main: colors.primary },
      secondary: { main: colors.secondary },
      background: {
        default: colors.background,
        paper: colors.surface,
      },
      text: {
        primary: colors.textPrimary,
        secondary: colors.textSecondary,
      },
      divider: colors.border,
      error: { main: colors.error },
      warning: { main: colors.warning },
      success: { main: colors.success },
      info: { main: colors.info },
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
    shape: { borderRadius: designTokens.surfaces.cardRadius },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            minHeight: 44,
            borderRadius: designTokens.surfaces.controlRadius,
          },
        },
      },
      MuiPaper: {
        styleOverrides: { root: { backgroundImage: "none" } },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            border: `1px solid ${colors.border}`,
            boxShadow: dark
              ? designTokens.surfaces.darkCardShadow
              : designTokens.surfaces.cardShadow,
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: designTokens.surfaces.controlRadius },
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          ":focus-visible": {
            outline: `3px solid ${designTokens.colors.focus}`,
            outlineOffset: 2,
          },
        },
      },
    },
  });
}
