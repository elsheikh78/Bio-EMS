import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateDeviceTlsCertificate } from "./device-tls-certificate";
const fixture = (name: string) =>
  readFileSync(join(process.cwd(), "src/modules/device-provisioning/test-fixtures", name + ".pem"));
const now = new Date("2026-10-28T12:00:00Z");
describe("device endpoint certificate preflight", () => {
  it.each(["https://ems.example.test:3443/", "https://192.168.1.20", "https://[2001:db8::10]"])(
    "accepts an exact SAN for %s",
    (origin) => {
      expect(validateDeviceTlsCertificate(fixture("valid"), origin, now).fingerprint256).toMatch(
        /^([A-F0-9]{2}:){31}[A-F0-9]{2}$/
      );
    }
  );
  it.each([
    "http://ems.example.test",
    "https://wrong.test",
    "https://192.168.1.21",
    "https://ems.example.test/path",
    "https://user:secret@ems.example.test",
  ])("rejects unsafe or mismatched %s", (origin) => {
    expect(() => validateDeviceTlsCertificate(fixture("valid"), origin, now)).toThrow();
  });
  it("rejects expired, future, malformed and CN-only trust", () => {
    expect(() =>
      validateDeviceTlsCertificate(fixture("expired"), "https://ems.example.test", now)
    ).toThrow(/expired/);
    expect(() =>
      validateDeviceTlsCertificate(
        fixture("valid"),
        "https://ems.example.test",
        new Date("2019-01-01")
      )
    ).toThrow(/not yet valid/);
    expect(() =>
      validateDeviceTlsCertificate(Buffer.alloc(200, 1), "https://ems.example.test", now)
    ).toThrow(/X509/);
    expect(() =>
      validateDeviceTlsCertificate(fixture("cn-only"), "https://ems.example.test", now)
    ).toThrow(/SAN/);
  });
});
