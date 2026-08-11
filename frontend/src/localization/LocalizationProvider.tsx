import { useEffect, type PropsWithChildren } from "react";
import { LocalizationContext } from "./context";
import { englishResources, localizationDefaults } from "./resources";
import type {
  SupportedLanguage,
  TextDirection,
  TranslationResources,
} from "./resources";

interface LocalizationProviderProps extends PropsWithChildren {
  language?: SupportedLanguage;
  direction?: TextDirection;
  resources?: TranslationResources;
}

export function LocalizationProvider({
  children,
  language = localizationDefaults.language,
  direction = localizationDefaults.direction,
  resources = englishResources,
}: LocalizationProviderProps) {
  const value = { language, direction, resources };

  useEffect(() => {
    const previousLanguage = document.documentElement.lang;
    const previousDirection = document.documentElement.dir;
    document.documentElement.lang = value.language;
    document.documentElement.dir = value.direction;

    return () => {
      document.documentElement.lang = previousLanguage;
      document.documentElement.dir = previousDirection;
    };
  }, [value.direction, value.language]);

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}
