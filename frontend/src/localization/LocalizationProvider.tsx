import { useEffect, type PropsWithChildren } from "react";
import { LocalizationContext } from "./context";
import { englishResources, localizationDefaults } from "./resources";

export function LocalizationProvider({ children }: PropsWithChildren) {
  const value = { ...localizationDefaults, resources: englishResources };

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
