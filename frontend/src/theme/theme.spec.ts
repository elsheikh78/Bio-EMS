import { describe, expect, it } from "vitest";
import { createAppTheme } from "./theme";

describe("BIO-EMS shared theme", () => {
  it("keeps light as the default and preserves direction", () => {
    const theme = createAppTheme("rtl");
    expect(theme.palette.mode).toBe("light");
    expect(theme.direction).toBe("rtl");
  });

  it("provides equivalent semantic colors in dark monitoring mode", () => {
    const theme = createAppTheme("ltr", "dark");
    expect(theme.palette.mode).toBe("dark");
    expect(theme.palette.success.main).toBeTruthy();
    expect(theme.palette.warning.main).toBeTruthy();
    expect(theme.palette.error.main).toBeTruthy();
    expect(theme.palette.info.main).toBeTruthy();
  });
});
