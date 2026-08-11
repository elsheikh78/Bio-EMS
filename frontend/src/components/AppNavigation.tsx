import { List, ListItem, ListItemButton, ListItemText } from "@mui/material";
import { NavLink } from "react-router-dom";
import { navigationItems } from "../navigation/navigationConfig";
import { useLocalization } from "../localization/useLocalization";

interface AppNavigationProps {
  label: string;
  onNavigate?: () => void;
}

export function AppNavigation({ label, onNavigate }: AppNavigationProps) {
  const { resources } = useLocalization();

  return (
    <nav aria-label={label}>
      <List>
        {navigationItems
          .filter((item) => item.visible)
          .map((item) => (
            <ListItem disablePadding key={item.id}>
              <ListItemButton
                component={NavLink}
                end={item.path === "/"}
                onClick={onNavigate}
                sx={{
                  borderInlineStart: "4px solid transparent",
                  "&.active": {
                    bgcolor: "action.selected",
                    borderInlineStartColor: "primary.main",
                    fontWeight: 700,
                  },
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
