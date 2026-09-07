import {
  AppBar,
  Box,
  Button,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import type { RefObject } from "react";
import { getAppHeaderStyles } from "./appHeaderStyles";
import { useLocalization } from "../localization/useLocalization";
import { useColorMode } from "../theme/colorMode";

interface AppHeaderProps {
  logoutLabel: string;
  menuButtonRef: RefObject<HTMLButtonElement | null>;
  menuLabel: string;
  onLogout: () => void;
  onMenuOpen: () => void;
  role: string;
  username: string;
}

export function AppHeader({
  logoutLabel,
  menuButtonRef,
  menuLabel,
  onLogout,
  onMenuOpen,
  role,
  username,
}: AppHeaderProps) {
  const { language, resources } = useLocalization();
  const { mode, toggleMode } = useColorMode();
  return (
    <AppBar
      color="inherit"
      elevation={0}
      position="fixed"
      data-testid="app-header"
      sx={getAppHeaderStyles}
    >
      <Toolbar
        sx={{
          minHeight: "68px !important",
          borderBottom: 1,
          borderColor: "divider",
          gap: 3,
          bgcolor: "background.paper",
        }}
      >
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
        <Box sx={{ display: { xs: "none", md: "block" } }}>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", letterSpacing: 1 }}
          >
            {language === "ar" ? "العمليات" : "OPERATIONS"}
          </Typography>
          <Typography variant="body2" sx={{ fontWeight: 700 }}>
            {language === "ar"
              ? "لوحة المتابعة / النظرة التنفيذية"
              : "Dashboard / Executive overview"}
          </Typography>
        </Box>
        <Box sx={{ flexGrow: 1 }} />
        <IconButton
          aria-label={
            mode === "light"
              ? resources.shell.switchToDark
              : resources.shell.switchToLight
          }
          color="primary"
          onClick={toggleMode}
          sx={{ border: 1, borderColor: "divider" }}
        >
          <Box
            aria-hidden
            component="span"
            sx={{ fontSize: "1.1rem", lineHeight: 1 }}
          >
            {mode === "light" ? "◐" : "☀"}
          </Box>
        </IconButton>
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
