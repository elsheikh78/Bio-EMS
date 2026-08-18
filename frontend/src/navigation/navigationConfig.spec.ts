import { describe, expect, it } from "vitest";
import { navigationItems } from "./navigationConfig";

describe("permission-aware navigation registry", () => {
  it("contains exactly the approved routes and centralized permission metadata", () => {
    expect(
      navigationItems.map(({ path, permission }) => [path, permission]),
    ).toEqual([
      ["/", "DASHBOARD_READ"],
      ["/dashboard", "DASHBOARD_READ"],
      ["/monitored-areas", "CONFIGURATION_READ"],
      ["/alarms", "ALARM_READ"],
      ["/devices", "DEVICE_READ"],
      ["/sensors-calibration", "CONFIGURATION_READ"],
      ["/configuration", "CONFIGURATION_READ"],
      ["/users", "USER_MANAGE"],
    ]);
  });

  it("contains no excluded routes or noncanonical CONFIG_READ alias", () => {
    const serialized = JSON.stringify(navigationItems);

    expect(serialized).not.toMatch(/assets|monitoring-points/i);
    expect(serialized).not.toContain('"CONFIG_READ"');
    for (const item of navigationItems) {
      expect(Object.keys(item).sort()).toEqual([
        "group",
        "id",
        "labelKey",
        "path",
        "permission",
      ]);
    }
  });
});
