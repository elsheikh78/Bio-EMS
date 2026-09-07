import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { OPENING_SEEN_KEY, OpeningExperience } from "./OpeningExperience";

describe("OpeningExperience", () => {
  afterEach(() => sessionStorage.clear());

  it("shows only localized non-customer startup content before mounting protected flows", async () => {
    render(
      <LocalizationProvider language="ar">
        <OpeningExperience duration={1}>
          <div>Protected customer content</div>
        </OpeningExperience>
      </LocalizationProvider>,
    );

    expect(
      screen.getByRole("status", { name: "شاشة بدء BIO-EMS الآمنة" }),
    ).toBeVisible();
    expect(screen.getByText("نظام المراقبة البيئية")).toBeVisible();
    expect(
      screen.queryByText("Protected customer content"),
    ).not.toBeInTheDocument();

    await waitFor(() =>
      expect(screen.getByText("Protected customer content")).toBeVisible(),
    );
    expect(sessionStorage.getItem(OPENING_SEEN_KEY)).toBe("1");
  });

  it("does not delay later application mounts in the same browser tab", () => {
    sessionStorage.setItem(OPENING_SEEN_KEY, "1");
    render(
      <LocalizationProvider language="en">
        <OpeningExperience>
          <div>Application ready</div>
        </OpeningExperience>
      </LocalizationProvider>,
    );

    expect(screen.getByText("Application ready")).toBeVisible();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
