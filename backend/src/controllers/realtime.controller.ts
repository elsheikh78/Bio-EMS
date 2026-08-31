import type { Request, Response } from "express";
import { realtimeEventBus } from "../modules/realtime/realtime-event.bus";

const HEARTBEAT_INTERVAL_MS = 25_000;

export function streamRealtimeEvents(req: Request, res: Response): void {
  res.status(200);
  res.setHeader("Content-Type", "text/event-stream; charset=utf-8");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();
  res.write("retry: 5000\n\n");

  const unsubscribe = realtimeEventBus.subscribe((event) => {
    res.write(`id: ${event.eventId}\n`);
    res.write(`event: ${event.type}\n`);
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  });

  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), HEARTBEAT_INTERVAL_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
  });
}
