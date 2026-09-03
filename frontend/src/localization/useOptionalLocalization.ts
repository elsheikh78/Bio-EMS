import { useContext } from "react";
import { LocalizationContext, type LocalizationValue } from "./context";
import { englishResources } from "./resources";

const englishFallback: LocalizationValue = {
  language: "en",
  direction: "ltr",
  resources: englishResources,
  setLanguage: () => undefined,
};

/** Supports independently rendered feature panels while AppProviders remains authoritative. */
export function useOptionalLocalization(): LocalizationValue {
  return useContext(LocalizationContext) ?? englishFallback;
}
