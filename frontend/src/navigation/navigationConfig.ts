import type { TranslationResources } from "../localization/resources";

export type NavigationLabelKey = keyof TranslationResources["navigation"];

export interface NavigationItemDefinition {
  id: string;
  path: string;
  labelKey: NavigationLabelKey;
  visible: boolean;
}

export const navigationItems = [
  { id: "workspace", path: "/", labelKey: "workspace", visible: true },
  { id: "dashboard", path: "/dashboard", labelKey: "dashboard", visible: true },
  {
    id: "monitored-areas",
    path: "/monitored-areas",
    labelKey: "monitoredAreas",
    visible: true,
  },
  { id: "alarms", path: "/alarms", labelKey: "alarms", visible: true },
  { id: "devices", path: "/devices", labelKey: "devices", visible: true },
  {
    id: "configuration",
    path: "/configuration",
    labelKey: "configuration",
    visible: true,
  },
] as const satisfies readonly NavigationItemDefinition[];
