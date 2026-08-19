import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { Fragment } from "react";
import { NavLink } from "react-router-dom";
import { hasPermission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import { navigationItems } from "../navigation/navigationConfig";
import { useLocalization } from "../localization/useLocalization";
import bioEmsLogo from "../assets/bio-ems-logo.png";

interface AppNavigationProps {
  label: string;
  onNavigate?: () => void;
}

export function AppNavigation({ label, onNavigate }: AppNavigationProps) {
  const { resources } = useLocalization();
  const { user } = useAuthentication();
  const permittedItems = navigationItems.filter(
    (item) => user && hasPermission(user.role, item.permission),
  );

  return (
    <nav aria-label={label}>
      <Box sx={{ px: 4, pt: 5, pb: 4 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 3,
            p: 2,
            borderRadius: 3,
            bgcolor: "rgba(255,255,255,0.96)",
          }}
        >
          <Box
            component="img"
            src={bioEmsLogo}
            alt=""
            sx={{ width: 58, height: 46, objectFit: "contain", flexShrink: 0 }}
          />
          <Typography sx={{ color: "#073B4C", fontSize: 18, fontWeight: 800 }}>
            BIO-EMS
          </Typography>
        </Box>
        <Typography sx={{ color: "#9FC6CB", fontSize: 10, letterSpacing: 1.2 }}>
          ENVIRONMENTAL MONITORING
        </Typography>
      </Box>
      <Box sx={{ mx: 4, mb: 5, p: 4, borderRadius: 3, bgcolor: "#0B4A5D" }}>
        <Typography sx={{ color: "#9FC6CB", fontSize: 10, letterSpacing: 1 }}>
          CUSTOMER / SCOPE
        </Typography>
        <Typography
          sx={{ color: "white", fontSize: 13, fontWeight: 700, mt: 1 }}
        >
          BIO EGYPT
        </Typography>
      </Box>
      <List sx={{ px: 3, pb: 6 }}>
        {permittedItems.map((item, index) => {
          const showGroup =
            index === 0 || permittedItems[index - 1]?.group !== item.group;
          return (
            <Fragment key={item.id}>
              {showGroup ? (
                <Typography
                  component="li"
                  sx={{
                    color: "#77A9B0",
                    fontSize: 10,
                    fontWeight: 700,
                    letterSpacing: 1.2,
                    px: 3.5,
                    pt: index === 0 ? 0 : 5,
                    pb: 2,
                  }}
                >
                  {item.group === "overview" ? "OVERVIEW" : "ADMINISTRATION"}
                </Typography>
              ) : null}
              <ListItem disablePadding key={item.id}>
                <ListItemButton
                  component={NavLink}
                  end={item.path === "/"}
                  onClick={onNavigate}
                  sx={{
                    minHeight: 44,
                    mb: 1,
                    borderRadius: 2.25,
                    color: "#D8E7E9",
                    borderInlineStart: "4px solid transparent",
                    "&.active": {
                      bgcolor: "#0B6B78",
                      borderInlineStartColor: "#6EE7DF",
                      color: "white",
                      fontWeight: 700,
                    },
                    "&:hover": { bgcolor: "#0B4A5D" },
                    "&:focus-visible": {
                      outline: "3px solid",
                      outlineColor: "primary.main",
                      outlineOffset: -3,
                    },
                  }}
                  to={item.path}
                >
                  <NavigationIcon id={item.id} />
                  <ListItemText
                    primary={resources.navigation[item.labelKey]}
                    slotProps={{ primary: { sx: { fontWeight: "inherit" } } }}
                  />
                </ListItemButton>
              </ListItem>
            </Fragment>
          );
        })}
      </List>
    </nav>
  );
}

function NavigationIcon({ id }: { id: string }) {
  const paths: Record<string, string> = {
    workspace: "M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z",
    dashboard: "M4 18V10M10 18V5M16 18v-7M22 18V8",
    "monitored-areas": "M4 7h16v12H4zM8 7V4h8v3M8 12h8M8 16h5",
    alarms: "M12 3 3 20h18L12 3zm0 6v5m0 3v.5",
    devices: "M7 3h10v18H7zM9 6h6M9 17h6M12 20v1",
    "sensors-calibration":
      "M12 3v10m0 0a4 4 0 1 0 4 4m-4-4a4 4 0 0 0-4 4m4-9h3M5 5h3M5 9h3",
    reports: "M5 3h14v18H5zM8 16v2m4-6v6m4-9v9M8 7h8",
    configuration:
      "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0-5v2m0 14v2M3 12h2m14 0h2M5.6 5.6 7 7m10 10 1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4",
    users:
      "M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm7-1a3 3 0 1 0 0-6M2 21v-3a6 6 0 0 1 12 0v3m2-8a5 5 0 0 1 5 5v3",
  };

  return (
    <Box
      component="svg"
      aria-hidden
      viewBox="0 0 24 24"
      sx={{ width: 19, height: 19, flexShrink: 0, me: 3 }}
    >
      <Box
        component="path"
        d={paths[id] ?? paths.workspace}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Box>
  );
}
