import { SensorRepository, Sensor } from "../repositories/sensor.repository";

const repository = new SensorRepository();

export function createSensor(sensor: Sensor): number {
    return repository.create(sensor);
}

export function getSensors(): Sensor[] {
    return repository.getAll();
}