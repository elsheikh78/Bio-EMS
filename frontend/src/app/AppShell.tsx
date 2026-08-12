import {
  Box,
  Drawer,
  GlobalStyles,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRef, useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { useAuthentication } from "../auth/useAuthentication";
import { AppHeader } from "../components/AppHeader";
import { AppNavigation } from "../components/AppNavigation";
import { SkipLink } from "../components/SkipLink";
import { useLocalization } from "../localization/useLocalization";

const navigationWidth = 280;
const mainContentId = "main-content";

export function AppShell() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const { resources } = useLocalization();
  const { logout, user } = useAuthentication();
  const navigate = useNavigate();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileNavigation = () => {
    setMobileNavigationOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
  };

  if (!user) return null;

  const handleLogout = async () => {
    await logout();
    void navigate("/login", { replace: true });
  };

  return (
    <Box
      data-testid="app-shell"
      sx={{
        display: "flex",
        maxWidth: "100vw",
        minHeight: "100vh",
        overflowX: "hidden",
      }}
    >
      <GlobalStyles
        styles={{
          "@media (prefers-reduced-motion: reduce)": {
            "*, *::before, *::after": {
              animationDuration: "0.01ms !important",
              animationIterationCount: "1 !important",
              scrollBehavior: "auto !important",
              transitionDuration: "0.01ms !important",
            },
          },
        }}
      />
      <SkipLink
        label={resources.shell.skipToContent}
        targetId={mainContentId}
      />
      <AppHeader
        logoutLabel={resources.authentication.logout}
        menuButtonRef={menuButtonRef}
        menuLabel={resources.shell.openNavigation}
        onLogout={() => void handleLogout()}
        onMenuOpen={() => setMobileNavigationOpen(true)}
        role={user.role}
        title={resources.shell.productName}
        username={user.username}
      />

      {desktop ? (
        <Drawer
          open
          slotProps={{
            paper: { component: "aside" },
          }}
          sx={{
            flexShrink: 0,
            width: navigationWidth,
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: navigationWidth,
            },
          }}
          variant="permanent"
        >
          <Toolbar />
          <AppNavigation label={resources.shell.primaryNavigation} />
        </Drawer>
      ) : (
        <Drawer
          ModalProps={{ keepMounted: true }}
          onClose={closeMobileNavigation}
          open={mobileNavigationOpen}
          slotProps={{
            paper: {
              sx: { maxWidth: "calc(100vw - 32px)", width: navigationWidth },
            },
          }}
          variant="temporary"
        >
          <AppNavigation
            label={resources.shell.primaryNavigation}
            onNavigate={closeMobileNavigation}
          />
        </Drawer>
      )}

      <Box
        component="main"
        id={mainContentId}
        sx={{ flexGrow: 1, minWidth: 0, p: { xs: 2, sm: 3, lg: 4 } }}
        tabIndex={-1}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
