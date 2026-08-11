import type { Theme } from "@mui/material/styles";

export function getAppHeaderLayering(theme: Theme) {
  return {
    desktop: theme.zIndex.drawer + 1,
    mobile: theme.zIndex.appBar,
  };
}

export function getAppHeaderStyles(theme: Theme) {
  const layering = getAppHeaderLayering(theme);

  return {
    zIndex: layering.mobile,
    [theme.breakpoints.up("md")]: {
      zIndex: layering.desktop,
    },
  };
}
