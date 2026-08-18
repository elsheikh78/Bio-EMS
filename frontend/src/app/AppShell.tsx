import {
  Box,
  Drawer,
  GlobalStyles,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRef, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useInitialFocus } from "../accessibility/useInitialFocus";
import { useAuthentication } from "../auth/useAuthentication";
import { AppHeader } from "../components/AppHeader";
import { AppNavigation } from "../components/AppNavigation";
import { SkipLink } from "../components/SkipLink";
import { useLocalization } from "../localization/useLocalization";

const navigationWidth = 248;
const mainContentId = "main-content";

export function AppShell() {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  const { resources } = useLocalization();
  const { logout, user } = useAuthentication();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const routeState = location.state as unknown;
  const focusAfterLogin =
    typeof routeState === "object" &&
    routeState !== null &&
    "focusAfterLogin" in routeState &&
    (routeState as { focusAfterLogin?: unknown }).focusAfterLogin === true;
  const mainContentRef = useInitialFocus<HTMLElement>(focusAfterLogin);

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
        bgcolor: "background.default",
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
              bgcolor: "#073B4C",
              color: "#D8E7E9",
              border: 0,
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
              sx: {
                maxWidth: "calc(100vw - 32px)",
                width: navigationWidth,
                bgcolor: "#073B4C",
                color: "#D8E7E9",
              },
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
        ref={mainContentRef}
        sx={{ flexGrow: 1, minWidth: 0, px: { xs: 4, sm: 6, lg: 8 }, py: 6 }}
        tabIndex={-1}
      >
        <Toolbar />
        <Box sx={{ width: "100%", maxWidth: 1600, mx: "auto" }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
