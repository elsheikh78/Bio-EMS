import { afterEach, describe, expect, it, vi } from "vitest";
import { localDateTimeValue } from "./date-time";

describe("localDateTimeValue", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps a persisted UTC instant aligned with the browser local datetime field", () => {
    vi.spyOn(Date.prototype, "getTimezoneOffset").mockReturnValue(-120);

    expect(localDateTimeValue("2099-01-01T00:00:00.000Z")).toBe(
      "2099-01-01T02:00",
    );
  });

  it("returns an empty field for a license without expiry", () => {
    expect(localDateTimeValue(null)).toBe("");
  });
});
