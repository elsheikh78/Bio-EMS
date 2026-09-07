import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { COLOR_MODE_STORAGE_KEY, useColorMode } from "./colorMode";
import { ColorModeProvider } from "./ColorModeProvider";

function ModeProbe() {
  const { mode, toggleMode } = useColorMode();
  return <button onClick={toggleMode}>{mode}</button>;
}

describe("ColorModeProvider", () => {
  afterEach(() => localStorage.clear());

  it("defaults to light and persists the optional dark monitoring theme", async () => {
    const user = userEvent.setup();
    render(
      <ColorModeProvider>
        <ModeProbe />
      </ColorModeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "light" }));

    expect(screen.getByRole("button", { name: "dark" })).toBeVisible();
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("dark");
  });

  it("restores the persisted mode", () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "dark");
    render(
      <ColorModeProvider>
        <ModeProbe />
      </ColorModeProvider>,
    );

    expect(screen.getByRole("button", { name: "dark" })).toBeVisible();
  });
});
