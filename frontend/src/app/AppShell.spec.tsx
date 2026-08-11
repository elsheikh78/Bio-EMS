import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import { AppProviders } from "./AppProviders";

function useViewport(width: number) {
  Object.defineProperty(window, "innerWidth", {
    configurable: true,
    value: width,
  });
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      addEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
      matches: query.includes("min-width:900px") ? width >= 900 : false,
      media: query,
      onchange: null,
      removeEventListener: vi.fn(),
    })),
  );
}

function renderShell(path = "/") {
  window.history.pushState({}, "", path);
  return render(
    <AppProviders>
      <App />
    </AppProviders>,
  );
}

describe("responsive application shell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("renders desktop navigation and marks the active route", () => {
    useViewport(1200);
    renderShell("/dashboard");

    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    expect(
      within(navigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getAllByRole("main")).toHaveLength(1);
  });

  it("opens and dismisses mobile navigation with Escape and restores focus", async () => {
    useViewport(320);
    const user = userEvent.setup();
    renderShell();

    const menuButton = screen.getByRole("button", {
      name: "Open primary navigation",
    });
    await user.click(menuButton);
    expect(
      screen.getByRole("navigation", { name: "Primary navigation" }),
    ).toBeVisible();

    await user.keyboard("{Escape}");
    await waitFor(() => expect(menuButton).toHaveFocus());
    const shellStyle = getComputedStyle(screen.getByTestId("app-shell"));
    expect(window.innerWidth).toBe(320);
    expect(shellStyle.overflowX).toBe("hidden");
  });

  it("closes the mobile drawer after navigation and restores focus", async () => {
    useViewport(320);
    const user = userEvent.setup();
    renderShell();

    const menuButton = screen.getByRole("button", {
      name: "Open primary navigation",
    });
    await user.click(menuButton);
    await user.click(screen.getByRole("link", { name: "Alarms" }));

    expect(
      await screen.findByRole("heading", { name: "Alarms" }),
    ).toBeInTheDocument();
    await waitFor(() => expect(menuButton).toHaveFocus());
  });

  it("provides a keyboard-reachable functional skip link", async () => {
    useViewport(1200);
    const user = userEvent.setup();
    renderShell();

    await user.tab();
    const skipLink = screen.getByRole("link", { name: "Skip to main content" });
    expect(skipLink).toHaveFocus();
    fireEvent.click(skipLink);
    expect(screen.getByRole("main")).toHaveFocus();
  });
});
