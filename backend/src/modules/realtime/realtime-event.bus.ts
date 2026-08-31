import { EventEmitter } from "node:events";

export const REALTIME_EVENT_NAME = "telemetry.accepted" as const;

export interface TelemetryAcceptedEvent {
  eventId: string;
  type: typeof REALTIME_EVENT_NAME;
  acceptedAt: string;
  siteCode: string;
  deviceId: string;
  sensorCodes: string[];
}

class RealtimeEventBus {
  private readonly emitter = new EventEmitter();

  publish(event: TelemetryAcceptedEvent): void {
    this.emitter.emit(REALTIME_EVENT_NAME, event);
  }

  subscribe(listener: (event: TelemetryAcceptedEvent) => void): () => void {
    this.emitter.on(REALTIME_EVENT_NAME, listener);
    return () => this.emitter.off(REALTIME_EVENT_NAME, listener);
  }
}

export const realtimeEventBus = new RealtimeEventBus();
