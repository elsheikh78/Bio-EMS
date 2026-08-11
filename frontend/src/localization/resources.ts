import type { Direction } from "@mui/material/styles";

export type SupportedLanguage = "en" | "ar";
export type TextDirection = Direction;

export interface TranslationResources {
  foundation: {
    title: string;
    description: string;
    deferredDescription: string;
  };
  notFound: { title: string; action: string };
}

export const englishResources = {
  foundation: {
    title: "BIO-EMS frontend foundation",
    description:
      "Architecture and quality foundations are ready for feature development.",
    deferredDescription:
      "Operational screens, authentication, and the application shell are intentionally deferred to later Sprint 14 stories.",
  },
  notFound: { title: "Page not found", action: "Return to foundation" },
} satisfies TranslationResources;

export const localizationDefaults = {
  language: "en",
  direction: "ltr",
} satisfies { language: SupportedLanguage; direction: TextDirection };
