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

  it("defaults to the approved dark control-room theme and persists light mode", async () => {
    const user = userEvent.setup();
    render(
      <ColorModeProvider>
        <ModeProbe />
      </ColorModeProvider>,
    );

    await user.click(screen.getByRole("button", { name: "dark" }));

    expect(screen.getByRole("button", { name: "light" })).toBeVisible();
    expect(localStorage.getItem(COLOR_MODE_STORAGE_KEY)).toBe("light");
  });

  it("restores the persisted mode", () => {
    localStorage.setItem(COLOR_MODE_STORAGE_KEY, "light");
    render(
      <ColorModeProvider>
        <ModeProbe />
      </ColorModeProvider>,
    );

    expect(screen.getByRole("button", { name: "light" })).toBeVisible();
  });
});
