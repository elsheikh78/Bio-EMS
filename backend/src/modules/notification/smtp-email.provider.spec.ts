import { describe, expect, it, vi } from "vitest";
import { SmtpEmailProvider } from "./smtp-email.provider";

describe("SmtpEmailProvider", () => {
  it("sends a readable alarm email and returns the SMTP receipt", async () => {
    const sendMail = vi.fn().mockResolvedValue({ messageId: "mail-1" });
    const provider = new SmtpEmailProvider(
      "SMTP",
      "alerts@example.com",
      { host: "smtp.example.com", port: 465, secure: true, username: "alerts", password: "secret" },
      { sendMail } as never
    );
    await expect(
      provider.send(
        {
          delivery: { severity: "WARNING" },
          recipient: "quality@example.com",
          payload: { alarmType: "LOW_TEMPERATURE", triggerValue: 1.2 },
        } as never,
        new AbortController().signal
      )
    ).resolves.toEqual({ messageId: "mail-1" });
    expect(sendMail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: "quality@example.com",
        subject: "[BIO-EMS WARNING] Environmental alarm",
        text: expect.stringContaining("triggerValue: 1.2"),
      })
    );
  });

  it("fails closed when SMTP provides no receipt", async () => {
    const provider = new SmtpEmailProvider(
      "SMTP",
      "alerts@example.com",
      { host: "smtp.example.com", port: 465, secure: true, username: "alerts", password: "secret" },
      { sendMail: vi.fn().mockResolvedValue({}) } as never
    );
    await expect(
      provider.send(
        {
          delivery: { severity: "CRITICAL" },
          recipient: "quality@example.com",
          payload: {},
        } as never,
        new AbortController().signal
      )
    ).rejects.toThrow("invalid receipt");
  });
});
