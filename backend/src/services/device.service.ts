import { DeviceRepository, Device } from "../repositories/device.repository";
import { UpdateDeviceInput } from "../modules/device/dto/device.schema";
import { AppError } from "../errors/app-error";
import { SiteRepository } from "../repositories/site.repository";

const repository = new DeviceRepository();
const siteRepository = new SiteRepository();

const deviceNotFound = () => new AppError("Device not found", 404, "DEVICE_NOT_FOUND");
const siteNotFound = () => new AppError("Site not found", 404, "SITE_NOT_FOUND");
const stateConflict = () =>
  new AppError("Device state transition not allowed", 409, "DEVICE_STATE_CONFLICT");

export function createDevice(device: Device): number {
  return repository.create(device);
}

export function getDevices(): Device[] {
  return repository.getAll();
}

export function getDeviceByDeviceId(deviceId: string): Device {
  const device = repository.findByDeviceId(deviceId);

  if (!device) {
    throw deviceNotFound();
  }

  return device;
}

export function updateDeviceMetadata(deviceId: string, update: UpdateDeviceInput): Device {
  const device = repository.updateMetadata(deviceId, update);

  if (!device) {
    throw deviceNotFound();
  }

  return device;
}

function resolveFailedTransition(deviceId: string): never {
  if (!repository.findByDeviceId(deviceId)) {
    throw deviceNotFound();
  }

  throw stateConflict();
}

export function activateDevice(deviceId: string): Device {
  const device = repository.findByDeviceId(deviceId);

  if (!device) {
    throw deviceNotFound();
  }

  if (device.status !== "pending" || device.activated !== 0) {
    throw stateConflict();
  }

  if (!siteRepository.findById(device.site_id)) {
    throw siteNotFound();
  }

  const activated = repository.transitionLifecycle(deviceId, "pending", 0, "active", 1);

  if (!activated) {
    return resolveFailedTransition(deviceId);
  }

  return activated;
}

export function disableDevice(deviceId: string): Device {
  const device = repository.findByDeviceId(deviceId);

  if (!device) {
    throw deviceNotFound();
  }

  if (device.status !== "active" || device.activated !== 1) {
    throw stateConflict();
  }

  const disabled = repository.transitionLifecycle(deviceId, "active", 1, "disabled", 0);

  if (!disabled) {
    return resolveFailedTransition(deviceId);
  }

  return disabled;
}
