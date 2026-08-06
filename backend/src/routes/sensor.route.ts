import { Router } from "express";
import * as sensorController from "../controllers/sensor.controller";

const router = Router();

router.post("/", sensorController.createSensor);

router.get("/", sensorController.getSensors);

export default router;
