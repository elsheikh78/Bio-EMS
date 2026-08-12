import { CssBaseline, ThemeProvider } from "@mui/material";
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { App } from "../App";
import {
  AuthenticationContext,
  type AuthenticationContextValue,
} from "../auth/AuthenticationContext";
import { getAppHeaderLayering } from "../components/appHeaderStyles";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { createAppTheme } from "../theme/theme";

const authenticatedAdmin = {
  status: "authenticated",
  user: { id: 1, username: "admin", role: "ADMIN" },
  loginPending: false,
  login: vi.fn(),
  logout: vi.fn(),
  retryRestoration: vi.fn(),
  protectedRequest: vi.fn(),
} satisfies AuthenticationContextValue;

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

function renderShell(path = "/", state?: unknown) {
  return render(
    <LocalizationProvider>
      <ThemeProvider theme={createAppTheme("ltr")}>
        <CssBaseline />
        <AuthenticationContext.Provider value={authenticatedAdmin}>
          <MemoryRouter initialEntries={[{ pathname: path, state }]}>
            <App />
          </MemoryRouter>
        </AuthenticationContext.Provider>
      </ThemeProvider>
    </LocalizationProvider>,
  );
}

describe("responsive application shell", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it("keeps the desktop title above the permanent drawer layer", () => {
    useViewport(1200);
    renderShell("/dashboard");

    const header = screen.getByTestId("app-header");
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const drawer = navigation.closest(".MuiDrawer-paper");
    const theme = createAppTheme("ltr");
    const headerLayering = getAppHeaderLayering(theme);
    const drawerZIndex = Number(getComputedStyle(drawer as HTMLElement).zIndex);

    expect(
      within(navigation).getByRole("link", { name: "Dashboard" }),
    ).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("BIO-EMS")).toBeVisible();
    expect(screen.getByText("admin")).toBeVisible();
    expect(screen.getByText("ADMIN")).toBeVisible();
    expect(screen.getByRole("button", { name: "Log out" })).toBeVisible();
    expect(drawer).not.toBeNull();
    expect(drawer?.querySelector(".MuiToolbar-root")).not.toBeNull();
    expect(headerLayering.mobile).toBe(theme.zIndex.appBar);
    expect(drawerZIndex).toBe(theme.zIndex.drawer);
    expect(headerLayering.desktop).toBeGreaterThan(drawerZIndex);
    expect(getAppHeaderLayering(createAppTheme("rtl"))).toEqual(headerLayering);
    expect(header).toHaveClass("MuiAppBar-root");
  });

  it("keeps the temporary mobile drawer above the header and dismisses it with Escape", async () => {
    useViewport(320);
    const user = userEvent.setup();
    renderShell();

    const menuButton = screen.getByRole("button", {
      name: "Open primary navigation",
    });
    await user.click(menuButton);
    const header = screen.getByTestId("app-header");
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const drawer = navigation.closest(".MuiDrawer-paper");

    expect(navigation).toBeVisible();
    expect(drawer).not.toBeNull();
    expect(
      Number(getComputedStyle(drawer as HTMLElement).zIndex),
    ).toBeGreaterThan(Number(getComputedStyle(header).zIndex));

    await user.keyboard("{Escape}");
    await waitFor(() => expect(menuButton).toHaveFocus());
    const shellStyle = getComputedStyle(screen.getByTestId("app-shell"));
    const main = screen.getByRole("main", { hidden: true });
    const mainStyle = getComputedStyle(main);
    expect(window.innerWidth).toBe(320);
    expect(Number.parseInt(shellStyle.maxWidth, 10)).toBeGreaterThanOrEqual(
      window.innerWidth,
    );
    expect(mainStyle.minWidth).toBe("0px");
    expect(screen.getByText("Operational workspace")).toBeVisible();
  });

  it("dismisses mobile navigation through the backdrop and restores focus", async () => {
    useViewport(320);
    const user = userEvent.setup();
    renderShell();

    const menuButton = screen.getByRole("button", {
      name: "Open primary navigation",
    });
    await user.click(menuButton);
    const navigation = screen.getByRole("navigation", {
      name: "Primary navigation",
    });
    const backdrop = document.querySelector(".MuiBackdrop-root");

    expect(navigation).toBeVisible();
    expect(backdrop).not.toBeNull();
    await user.click(backdrop as HTMLElement);

    await waitFor(() => expect(navigation).not.toBeVisible());
    expect(menuButton).toHaveFocus();
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

  it("focuses main content only when entering the shell after Login", async () => {
    useViewport(1200);
    renderShell("/", { focusAfterLogin: true });

    await waitFor(() => expect(screen.getByRole("main")).toHaveFocus());
  });
});
