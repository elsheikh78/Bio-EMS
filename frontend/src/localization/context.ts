import { createContext } from "react";
import type { englishResources, localizationDefaults } from "./resources";

export interface LocalizationValue {
  language: typeof localizationDefaults.language;
  direction: typeof localizationDefaults.direction;
  resources: typeof englishResources;
}

export const LocalizationContext = createContext<LocalizationValue | null>(
  null,
);
