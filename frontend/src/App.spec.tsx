import { render, screen } from "@testing-library/react";
import { useTheme } from "@mui/material";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
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
  afterEach(() => vi.restoreAllMocks());

  it("renders the workspace through the complete provider and shell composition", () => {
    renderApplication("/");
    expect(
      screen.getByRole("heading", { name: "Operational workspace" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(screen.getByTestId("provider-probe")).toHaveTextContent(
      "query:ltr:en:ltr:/",
    );
    expect(document.documentElement).toHaveAttribute("lang", "en");
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it.each([
    ["/dashboard", "Dashboard"],
    ["/monitored-areas", "Monitored Areas"],
    ["/alarms", "Alarms"],
    ["/devices", "Devices"],
    ["/configuration", "Configuration"],
  ])("renders the approved placeholder at %s", (path, heading) => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    renderApplication(path);

    expect(screen.getByRole("heading", { name: heading })).toBeInTheDocument();
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("preserves the foundation redirect", async () => {
    renderApplication("/foundation");

    expect(
      await screen.findByRole("heading", { name: "Operational workspace" }),
    ).toBeInTheDocument();
    expect(window.location.pathname).toBe("/");
  });

  it("renders the not-found route inside the shell", () => {
    renderApplication("/missing");
    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to workspace/i }),
    ).toHaveAttribute("href", "/");
    expect(screen.getByTestId("provider-probe")).toHaveTextContent(
      "query:ltr:en:ltr:/missing",
    );
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it.each(["/users", "/assets", "/monitoring-points"])(
    "does not create the excluded route %s",
    (path) => {
      renderApplication(path);
      expect(
        screen.getByRole("heading", { name: "Page not found" }),
      ).toBeInTheDocument();
    },
  );
});
