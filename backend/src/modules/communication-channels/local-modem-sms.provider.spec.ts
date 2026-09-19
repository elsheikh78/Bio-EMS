import { describe, expect, it, vi } from "vitest";
import { LocalModemSmsProvider, type ModemSmsTransport } from "./local-modem-sms.provider";

describe("LocalModemSmsProvider", () => {
  it("passes a bounded alarm message and E.164 recipient to the modem transport", async () => {
    const transport: ModemSmsTransport = { send: vi.fn().mockResolvedValue("42") };
    const provider = new LocalModemSmsProvider("COM7", transport);
    const envelope = {
      delivery: { severity: "CRITICAL" as const },
      recipient: "+201001234567",
      payload: { alarmType: "HIGH_TEMPERATURE", triggerValue: 9.2 },
    } as never;
    await expect(provider.send(envelope, new AbortController().signal)).resolves.toEqual({
      messageId: "42",
    });
    expect(transport.send).toHaveBeenCalledWith(
      "COM7",
      "+201001234567",
      "BIO-EMS CRITICAL: HIGH_TEMPERATURE 9.2",
      expect.any(AbortSignal)
    );
  });
  it("propagates modem failures without inventing a receipt", async () => {
    const transport: ModemSmsTransport = {
      send: vi.fn().mockRejectedValue(new Error("modem offline")),
    };
    const provider = new LocalModemSmsProvider("COM8", transport);
    await expect(
      provider.send(
        { delivery: { severity: "WARNING" }, recipient: "+201001234567", payload: {} } as never,
        new AbortController().signal
      )
    ).rejects.toThrow("modem offline");
  });
});
