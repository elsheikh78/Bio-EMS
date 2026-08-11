import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FoundationPage } from "../pages/FoundationPage";
import { NotFoundPage } from "../pages/NotFoundPage";
import { createAppTheme } from "../theme/theme";
import { LocalizationProvider } from "./LocalizationProvider";
import type {
  SupportedLanguage,
  TextDirection,
  TranslationResources,
} from "./resources";
import { englishResources } from "./resources";

const alternativeResources = {
  ...englishResources,
  foundation: {
    title: "Alternative foundation title",
    description: "Alternative foundation description",
    deferredDescription: "Alternative deferred description",
  },
  notFound: {
    title: "Alternative missing-page title",
    action: "Alternative return action",
  },
  errorBoundary: {
    title: "Alternative startup failure",
    reload: "Alternative reload action",
  },
} satisfies TranslationResources;

const futureLanguage: SupportedLanguage = "ar";
const futureDirection: TextDirection = "rtl";

describe("localization contracts", () => {
  it("accepts future language, RTL direction, and independently translated text", () => {
    expect(futureLanguage).toBe("ar");
    expect(futureDirection).toBe("rtl");
    expect(alternativeResources.foundation.title).toBe(
      "Alternative foundation title",
    );
  });

  it("creates an RTL-aware Material UI theme", () => {
    expect(createAppTheme("rtl").direction).toBe("rtl");
  });

  it("renders foundation content through localization resources", () => {
    render(
      <LocalizationProvider
        language={futureLanguage}
        direction={futureDirection}
        resources={alternativeResources}
      >
        <FoundationPage />
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("heading", { name: "Alternative foundation title" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alternative foundation description"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Alternative deferred description"),
    ).toBeInTheDocument();
  });

  it("renders not-found content through localization resources", () => {
    render(
      <MemoryRouter>
        <LocalizationProvider resources={alternativeResources}>
          <NotFoundPage />
        </LocalizationProvider>
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", {
        name: "Alternative missing-page title",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Alternative return action" }),
    ).toHaveAttribute("href", "/");
  });
});
