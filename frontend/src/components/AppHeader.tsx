import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import type { RefObject } from "react";

interface AppHeaderProps {
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuLabel: string;
  onMenuOpen: () => void;
  title: string;
}

export function AppHeader({
  menuButtonRef,
  menuLabel,
  onMenuOpen,
  title,
}: AppHeaderProps) {
  return (
    <AppBar color="inherit" elevation={0} position="fixed">
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
        <Typography component="span" sx={{ fontWeight: 700 }} variant="h6">
          {title}
        </Typography>
      </Toolbar>
    </AppBar>
  );
}
