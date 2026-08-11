import {
  Box,
  Drawer,
  GlobalStyles,
  Toolbar,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { useRef, useState } from "react";
import { Outlet } from "react-router-dom";
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
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const closeMobileNavigation = () => {
    setMobileNavigationOpen(false);
    window.requestAnimationFrame(() => menuButtonRef.current?.focus());
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
        menuButtonRef={menuButtonRef}
        menuLabel={resources.shell.openNavigation}
        onMenuOpen={() => setMobileNavigationOpen(true)}
        title={resources.shell.productName}
      />

      {desktop ? (
        <Drawer
          open
          slotProps={{ paper: { component: "aside" } }}
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
