import { z } from "zod";

export const telemetryRangeQuerySchema = z
  .object({
    sensorCode: z.string().trim().min(1),

    from: z.string().datetime(),

    to: z.string().datetime(),
  })
  .refine(
    (value) =>
      new Date(value.from).getTime() <
      new Date(value.to).getTime(),
    {
      message: "from must be earlier than to",
      path: ["to"],
    },
  );