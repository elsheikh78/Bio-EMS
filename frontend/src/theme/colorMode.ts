import { createContext, useContext } from "react";
import type { PaletteMode } from "@mui/material";

export const COLOR_MODE_STORAGE_KEY = "bioems.colorMode";

export interface ColorModeValue {
  mode: PaletteMode;
  toggleMode: () => void;
}

export const ColorModeContext = createContext<ColorModeValue>({
  mode: "light",
  toggleMode: () => undefined,
});

export function useColorMode() {
  return useContext(ColorModeContext);
}
