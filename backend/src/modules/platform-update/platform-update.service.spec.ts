import { describe, expect, it } from "vitest";
import {
  cloudUpdateUrl,
  compareUpdateVersions,
  parseInstalledUpdateManifest,
} from "./platform-update.service";
import { deviceProvisioningFlashBindSchema } from "../device-provisioning/device-provisioning.schema";
const device = {
  installationId: "1f2f2f2f-2f2f-4f2f-8f2f-2f2f2f2f2f2f",
  deviceId: "MAIN-01",
  port: "COM3",
  platformUrl: "https://192.168.1.20",
};
describe("Pilot update and network policy", () => {
  it("reads productVersion from the installer manifest and refuses the wrong version field", () => {
    const sourceCommit = "a".repeat(40);
    expect(
      parseInstalledUpdateManifest({ schemaVersion: 1, productVersion: "0.20.0", sourceCommit })
    ).toEqual({ productVersion: "0.20.0", sourceCommit });
    expect(() => parseInstalledUpdateManifest({ version: "0.20.0", sourceCommit })).toThrow();
  });
  it("enables cloud download only with an explicit flag and a credential-free HTTPS URL", () => {
    expect(
      cloudUpdateUrl({ BIOEMS_UPDATE_CLOUD_URL: "https://updates.example/client.exe" })
    ).toBeNull();
    expect(cloudUpdateUrl({ BIOEMS_UPDATE_CLOUD_ENABLED: "true" })).toBeNull();
    expect(
      cloudUpdateUrl({
        BIOEMS_UPDATE_CLOUD_ENABLED: "true",
        BIOEMS_UPDATE_CLOUD_URL: "http://updates.example/client.exe",
      })
    ).toBeNull();
    expect(
      cloudUpdateUrl({
        BIOEMS_UPDATE_CLOUD_ENABLED: "true",
        BIOEMS_UPDATE_CLOUD_URL: "https://user:password@updates.example/client.exe",
      })
    ).toBeNull();
    expect(
      cloudUpdateUrl({
        BIOEMS_UPDATE_CLOUD_ENABLED: "true",
        BIOEMS_UPDATE_CLOUD_URL: "https://updates.example/client.exe",
      })
    ).toBe("https://updates.example/client.exe");
  });
  it("compares numeric versions rather than lexicographic values", () => {
    expect(compareUpdateVersions("0.20.10", "0.20.2")).toBe(1);
    expect(compareUpdateVersions("0.19.99", "0.20.0")).toBe(-1);
    expect(compareUpdateVersions("0.20.0", "0.20.0")).toBe(0);
    expect(() => compareUpdateVersions("malformed", "0.20.0")).toThrow();
  });
  it("accepts Ethernet without secrets and refuses leftover Wi-Fi secrets", () => {
    expect(
      deviceProvisioningFlashBindSchema.parse({ ...device, networkMode: "ethernet" }).networkMode
    ).toBe("ethernet");
    expect(
      deviceProvisioningFlashBindSchema.safeParse({
        ...device,
        networkMode: "ethernet",
        wifiSsid: "secret",
        wifiPassword: "secret123",
      }).success
    ).toBe(false);
  });
  it("requires credentials for Wi-Fi and preserves legacy Wi-Fi requests", () => {
    expect(deviceProvisioningFlashBindSchema.safeParse(device).success).toBe(false);
    expect(
      deviceProvisioningFlashBindSchema.parse({
        ...device,
        wifiSsid: "BIO",
        wifiPassword: "secret123",
      }).networkMode
    ).toBe("wifi");
    expect(
      deviceProvisioningFlashBindSchema.safeParse({ ...device, networkMode: "unknown" }).success
    ).toBe(false);
  });
});
