import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import type { RefObject } from "react";
import { getAppHeaderStyles } from "./appHeaderStyles";

interface AppHeaderProps {
  logoutLabel: string;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuLabel: string;
  onLogout: () => void;
  onMenuOpen: () => void;
  role: string;
  title: string;
  username: string;
}

export function AppHeader({
  logoutLabel,
  menuButtonRef,
  menuLabel,
  onLogout,
  onMenuOpen,
  role,
  title,
  username,
}: AppHeaderProps) {
  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      data-testid="app-header"
      sx={getAppHeaderStyles}
    >
      <Toolbar sx={{ borderBottom: 1, borderColor: "divider", gap: 2 }}>
        <Button
          aria-label={menuLabel}
          onClick={onMenuOpen}
          ref={menuButtonRef}
          sx={{ display: { md: "none" }, minWidth: 44 }}
        >
          <Box aria-hidden component="span" sx={{ fontSize: "1.5rem" }}>
            ☰
          </Box>
        </Button>
        <Typography
          component="span"
          sx={{ display: { xs: "none", sm: "block" }, fontWeight: 700 }}
          variant="h6"
        >
          {title}
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        <Box sx={{ minWidth: 0, textAlign: "end" }}>
          <Typography noWrap sx={{ fontWeight: 600 }} variant="body2">
            {username}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {role}
          </Typography>
        </Box>
        <Button onClick={onLogout}>{logoutLabel}</Button>
      </Toolbar>
    </AppBar>
  );
}
