import { useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { LocalizationContext } from "./context";
import {
  arabicResources,
  englishResources,
  localizationDefaults,
} from "./resources";
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

export const LANGUAGE_STORAGE_KEY = "bioems.language";

function storedLanguage(): SupportedLanguage {
  try {
    return localStorage.getItem(LANGUAGE_STORAGE_KEY) === "ar" ? "ar" : "en";
  } catch {
    return localizationDefaults.language;
  }
}

export function LocalizationProvider({
  children,
  language,
  direction,
  resources,
}: LocalizationProviderProps) {
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    () => language ?? storedLanguage(),
  );
  const selectedDirection =
    direction ?? (selectedLanguage === "ar" ? "rtl" : "ltr");
  const selectedResources =
    resources ??
    (selectedLanguage === "ar" ? arabicResources : englishResources);
  const value = useMemo(
    () => ({
      language: selectedLanguage,
      direction: selectedDirection,
      resources: selectedResources,
      setLanguage: (nextLanguage: SupportedLanguage) => {
        setSelectedLanguage(nextLanguage);
        try {
          localStorage.setItem(LANGUAGE_STORAGE_KEY, nextLanguage);
        } catch {
          // Language switching remains available when browser storage is blocked.
        }
      },
    }),
    [selectedDirection, selectedLanguage, selectedResources],
  );

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
