import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import {
  LANGUAGE_STORAGE_KEY,
  LocalizationProvider,
} from "../localization/LocalizationProvider";
import { LanguageSwitcher } from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
    document.documentElement.dir = "ltr";
  });

  it("switches globally to Arabic RTL and persists the selection", async () => {
    const user = userEvent.setup();
    render(
      <LocalizationProvider language="en">
        <LanguageSwitcher />
      </LocalizationProvider>,
    );

    await user.click(
      screen.getByRole("button", { name: "تغيير اللغة إلى العربية" }),
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "ar");
      expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });
    expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe("ar");
    expect(
      screen.getByRole("button", { name: "Switch language to English" }),
    ).toBeInTheDocument();
  });

  it("restores the persisted language on the next mount", async () => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, "ar");
    render(
      <LocalizationProvider>
        <LanguageSwitcher />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(document.documentElement).toHaveAttribute("lang", "ar");
      expect(document.documentElement).toHaveAttribute("dir", "rtl");
    });
  });
});
