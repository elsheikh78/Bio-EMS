import { createContext } from "react";
import type {
  SupportedLanguage,
  TextDirection,
  TranslationResources,
} from "./resources";

export interface LocalizationValue {
  language: SupportedLanguage;
  direction: TextDirection;
  resources: TranslationResources;
  setLanguage: (language: SupportedLanguage) => void;
}

export const LocalizationContext = createContext<LocalizationValue | null>(
  null,
);
