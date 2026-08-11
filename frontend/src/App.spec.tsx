import { render, screen } from "@testing-library/react";
import { useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";
import { AppProviders } from "./app/AppProviders";
import { useLocalization } from "./localization/useLocalization";

function ProviderProbe() {
  const queryClient = useQueryClient();
  const theme = useTheme();
  const localization = useLocalization();
  const location = useLocation();

  return (
    <output data-testid="provider-probe">
      {queryClient ? "query" : ""}:{theme.direction}:{localization.language}:
      {localization.direction}:{location.pathname}
    </output>
  );
}

function renderApplication(path: string) {
  window.history.pushState({}, "", path);
  return render(
    <AppProviders>
      <ProviderProbe />
      <App />
    </AppProviders>,
  );
}

describe("frontend foundation routing", () => {
  it("renders the foundation placeholder without feature claims", () => {
    renderApplication("/");
    expect(
      screen.getByRole("heading", { name: /frontend foundation/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/intentionally deferred/i)).toBeInTheDocument();
    expect(screen.getByTestId("provider-probe")).toHaveTextContent(
      "query:ltr:en:ltr:/",
    );
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it("renders the not-found route", () => {
    renderApplication("/missing");
    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to foundation/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByTestId("provider-probe")).toHaveTextContent(
      "query:ltr:en:ltr:/missing",
    );
  });
});
