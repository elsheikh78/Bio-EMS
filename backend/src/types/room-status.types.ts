export interface RoomStatus {

    roomId: number;

    roomName: string;

    siteId: number;

    siteName: string;

    temperature: number | null;

    humidity: number | null;

    temperatureStatus:
        | "NORMAL"
        | "WARNING"
        | "CRITICAL"
        | "UNKNOWN";

    humidityStatus:
        | "NORMAL"
        | "WARNING"
        | "CRITICAL"
        | "UNKNOWN";

    activeAlarms: number;

    online: boolean;

    lastUpdate: string | null;

}