import { DeviceRepository, Device } from "../repositories/device.repository";

const repository = new DeviceRepository();

export function createDevice(device: Device): number {

    return repository.create(device);

}

export function getDevices(): Device[] {

    return repository.getAll();

}