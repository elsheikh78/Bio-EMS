import { describe, expect, it } from "vitest";
import { createAppTheme } from "./theme";

describe("BIO-EMS shared theme", () => {
  it("uses the approved dark control-room default and preserves direction", () => {
    const theme = createAppTheme("rtl");
    expect(theme.palette.mode).toBe("dark");
    expect(theme.direction).toBe("rtl");
  });

  it("preserves semantic colors and supports an explicit light mode", () => {
    const darkTheme = createAppTheme("ltr", "dark");
    expect(darkTheme.palette.success.main).toBeTruthy();
    expect(darkTheme.palette.warning.main).toBeTruthy();
    expect(darkTheme.palette.error.main).toBeTruthy();
    expect(darkTheme.palette.info.main).toBeTruthy();

    const lightTheme = createAppTheme("ltr", "light");
    expect(lightTheme.palette.mode).toBe("light");
  });
});
