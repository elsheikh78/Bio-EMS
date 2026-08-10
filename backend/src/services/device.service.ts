import { DeviceRepository, Device } from "../repositories/device.repository";
import { UpdateDeviceInput } from "../modules/device/dto/device.schema";
import { AppError } from "../errors/app-error";

const repository = new DeviceRepository();

export function createDevice(device: Device): number {
  return repository.create(device);
}

export function getDevices(): Device[] {
  return repository.getAll();
}

export function getDeviceByDeviceId(deviceId: string): Device {
  const device = repository.findByDeviceId(deviceId);

  if (!device) {
    throw new AppError("Device not found", 404, "DEVICE_NOT_FOUND");
  }

  return device;
}

export function updateDeviceMetadata(deviceId: string, update: UpdateDeviceInput): Device {
  const device = repository.updateMetadata(deviceId, update);

  if (!device) {
    throw new AppError("Device not found", 404, "DEVICE_NOT_FOUND");
  }

  return device;
}
