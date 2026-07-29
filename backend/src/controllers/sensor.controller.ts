import { Request, Response } from "express";
import { asyncHandler } from "../middleware/async-handler";
import * as sensorService from "../services/sensor.service";

export const createSensor = asyncHandler(
    async (req: Request, res: Response) => {

        const id = sensorService.createSensor(req.body);

        res.status(201).json({
            id
        });

    }
);

export const getSensors = asyncHandler(
    async (_req: Request, res: Response) => {

        const sensors = sensorService.getSensors();

        res.json(sensors);

    }
);