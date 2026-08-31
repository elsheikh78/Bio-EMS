import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { z } from "zod";
import { useAuthentication } from "../auth/useAuthentication";
import { dashboardQueryKeys } from "../dashboard/queries";
import { monitoredAreasQueryKeys } from "../monitoredAreas/queries";

export const telemetryAcceptedEventSchema = z
  .object({
    eventId: z.string(),
    type: z.literal("telemetry.accepted"),
    acceptedAt: z.string(),
    siteCode: z.string(),
    deviceId: z.string(),
    sensorCodes: z.array(z.string()),
  })
  .strict();

export function parseSseDataBlock(block: string) {
  const data = block
    .split("\n")
    .filter((line) => line.startsWith("data:"))
    .map((line) => line.slice(5).trimStart())
    .join("\n");

  if (!data) return undefined;

  try {
    return telemetryAcceptedEventSchema.safeParse(JSON.parse(data)).data;
  } catch {
    return undefined;
  }
}

export function useRealtimeTelemetrySync(): void {
  const { protectedRequest, status } = useAuthentication();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (status !== "authenticated") return;

    const controller = new AbortController();

    const waitForReconnect = () =>
      new Promise<void>((resolve) => {
        const timeout = window.setTimeout(resolve, 5_000);
        controller.signal.addEventListener(
          "abort",
          () => {
            window.clearTimeout(timeout);
            resolve();
          },
          { once: true },
        );
      });

    async function subscribe() {
      while (!controller.signal.aborted) {
        try {
          const response = await protectedRequest<Response>(
            "/realtime/events",
            {
              headers: { Accept: "text/event-stream" },
              responseMode: "response",
              signal: controller.signal,
            },
          );
          if (!(response instanceof Response)) return;
          const reader = response.body?.getReader();
          if (!reader) {
            await waitForReconnect();
            continue;
          }

          const decoder = new TextDecoder();
          let buffer = "";

          while (!controller.signal.aborted) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });

            let boundary = buffer.indexOf("\n\n");
            while (boundary >= 0) {
              const event = parseSseDataBlock(buffer.slice(0, boundary));
              buffer = buffer.slice(boundary + 2);
              if (event) {
                await Promise.all([
                  queryClient.invalidateQueries({
                    queryKey: dashboardQueryKeys.all,
                  }),
                  queryClient.invalidateQueries({
                    queryKey: monitoredAreasQueryKeys.all,
                  }),
                ]);
              }
              boundary = buffer.indexOf("\n\n");
            }
          }
        } catch {
          // The interval-based queries remain the resilient fallback while the
          // authenticated stream reconnects.
        }
        await waitForReconnect();
      }
    }

    void subscribe();
    return () => controller.abort();
  }, [protectedRequest, queryClient, status]);
}
