import { Request, Response } from "express";
import { DashboardService } from "../services/dashboard.service";

export class DashboardController {

    private dashboardService = new DashboardService();

    async getSummary(
        req: Request,
        res: Response
    ): Promise<void> {

        const summary =
            await this.dashboardService.getSummary();

        res.json(summary);

    }

    async getLatestTelemetry(
        req: Request,
        res: Response
    ): Promise<void> {

        const telemetry =
            await this.dashboardService.getLatestTelemetry();

        res.json(telemetry);

    }

    async getRoomStatus(
        req: Request,
        res: Response
    ): Promise<void> {

        const rooms =
            await this.dashboardService.getRoomStatus();

        res.json(rooms);

    }

    async getAlarmStatistics(
        req: Request,
        res: Response
    ): Promise<void> {

        const statistics =
            await this.dashboardService.getAlarmStatistics();

        res.json(statistics);

    }

}