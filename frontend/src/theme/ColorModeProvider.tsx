import { useMemo, useState, type PropsWithChildren } from "react";
import type { PaletteMode } from "@mui/material";
import { COLOR_MODE_STORAGE_KEY, ColorModeContext } from "./colorMode";

function storedMode(): PaletteMode {
  try {
    return localStorage.getItem(COLOR_MODE_STORAGE_KEY) === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export function ColorModeProvider({ children }: PropsWithChildren) {
  const [mode, setMode] = useState<PaletteMode>(storedMode);
  const value = useMemo(
    () => ({
      mode,
      toggleMode: () => {
        setMode((current) => {
          const next = current === "light" ? "dark" : "light";
          try {
            localStorage.setItem(COLOR_MODE_STORAGE_KEY, next);
          } catch {
            // Theme switching remains available when browser storage is blocked.
          }
          return next;
        });
      },
    }),
    [mode],
  );

  return (
    <ColorModeContext.Provider value={value}>
      {children}
    </ColorModeContext.Provider>
  );
}
