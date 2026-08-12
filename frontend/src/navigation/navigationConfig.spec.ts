import { describe, expect, it } from "vitest";
import { navigationItems } from "./navigationConfig";

describe("presentational navigation registry", () => {
  it("contains exactly the approved visible routes", () => {
    expect(navigationItems.map(({ path }) => path)).toEqual([
      "/",
      "/dashboard",
      "/monitored-areas",
      "/alarms",
      "/devices",
      "/configuration",
    ]);
  });

  it("contains no roles, permissions, or excluded routes", () => {
    const serialized = JSON.stringify(navigationItems);

    expect(serialized).not.toMatch(/role|permission/i);
    expect(serialized).not.toMatch(/users|assets|monitoring-points/i);
    for (const item of navigationItems) {
      expect(Object.keys(item).sort()).toEqual([
        "id",
        "labelKey",
        "path",
        "visible",
      ]);
    }
  });
});
