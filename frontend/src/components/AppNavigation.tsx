import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Typography,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import { hasPermission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import { navigationItems } from "../navigation/navigationConfig";
import { useLocalization } from "../localization/useLocalization";

interface AppNavigationProps {
  label: string;
  onNavigate?: () => void;
}

export function AppNavigation({ label, onNavigate }: AppNavigationProps) {
  const { resources } = useLocalization();
  const { user } = useAuthentication();

  return (
    <nav aria-label={label}>
      <Box sx={{ px: 5, pt: 6, pb: 4 }}>
        <Typography sx={{ color: "white", fontSize: 19, fontWeight: 800 }}>
          BIO-EMS
        </Typography>
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
      <List sx={{ px: 3 }}>
        {navigationItems
          .filter((item) => user && hasPermission(user.role, item.permission))
          .map((item) => (
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
                <ListItemText
                  primary={resources.navigation[item.labelKey]}
                  slotProps={{ primary: { sx: { fontWeight: "inherit" } } }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
    </nav>
  );
}
