export const englishResources = {
  foundation: {
    title: "BIO-EMS frontend foundation",
    description:
      "Architecture and quality foundations are ready for feature development.",
  },
  notFound: { title: "Page not found", action: "Return to foundation" },
} as const;

export const localizationDefaults = {
  language: "en",
  direction: "ltr" as const,
};
