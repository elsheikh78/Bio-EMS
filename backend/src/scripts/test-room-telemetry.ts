import "dotenv/config";
import { getLatestRoomTelemetry } from "../../database/influx/queries/room-status.query";

async function main(): Promise<void> {

    try {

        const telemetry = await getLatestRoomTelemetry();

        console.log(
            JSON.stringify(
                telemetry,
                null,
                2
            )
        );

    } catch (error) {

        console.error(error);

    }

}

main();