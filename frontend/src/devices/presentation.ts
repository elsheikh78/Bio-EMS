import type { Device } from "./contracts";

export function summarizeDevices(devices: Device[]) {
  return {
    total: devices.length,
    active: devices.filter((device) => device.status === "active").length,
    pending: devices.filter((device) => device.status === "pending").length,
    disabled: devices.filter((device) => device.status === "disabled").length,
  };
}
