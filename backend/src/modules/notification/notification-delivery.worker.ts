import type {
  DeliveryEnvelope,
  NotificationDeliveryRepository,
} from "./notification-delivery.repository";

export interface DeliveryProvider {
  readonly name: string;
  readonly channel: "EMAIL" | "SMS" | "WHATSAPP" | "TELEGRAM";
  send(envelope: DeliveryEnvelope, signal: AbortSignal): Promise<{ messageId: string }>;
}

export class NotificationDeliveryWorker {
  private running = false;
  constructor(
    private readonly repository: NotificationDeliveryRepository,
    private readonly providers: readonly DeliveryProvider[],
    private readonly timeoutMs = 15_000
  ) {}

  async tick(now = new Date()): Promise<"IDLE" | "SENT" | "RETRY"> {
    if (this.running) return "IDLE";
    this.running = true;
    try {
      const staleBefore = new Date(now.getTime() - this.timeoutMs * 2).toISOString();
      const delivery = this.repository.claimDue(now.toISOString(), staleBefore);
      if (!delivery?.claim_token) return "IDLE";
      const provider = this.providers.find((candidate) => candidate.channel === delivery.channel);
      const envelope = this.repository.envelope(delivery);
      const attemptNumber = delivery.attempt_count + 1;
      const attemptId = this.repository.startAttempt(
        delivery.id,
        attemptNumber,
        provider?.name ?? "UNAVAILABLE",
        now.toISOString()
      );
      if (!provider || !envelope) {
        this.repository.finishAttempt(
          attemptId,
          "FAILED",
          now.toISOString(),
          undefined,
          "PROVIDER_OR_RECIPIENT_UNAVAILABLE"
        );
        this.fail(
          delivery.id,
          delivery.claim_token,
          now,
          attemptNumber,
          "PROVIDER_OR_RECIPIENT_UNAVAILABLE"
        );
        return "RETRY";
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), this.timeoutMs);
      try {
        const receipt = await provider.send(envelope, controller.signal);
        this.repository.finishAttempt(
          attemptId,
          "SENT",
          new Date().toISOString(),
          receipt.messageId
        );
        this.repository.recordSent(
          delivery.id,
          delivery.claim_token,
          new Date().toISOString(),
          receipt.messageId
        );
        return "SENT";
      } catch (_error) {
        const timedOut = controller.signal.aborted;
        const code = timedOut ? "PROVIDER_TIMEOUT" : "PROVIDER_FAILED";
        this.repository.finishAttempt(
          attemptId,
          timedOut ? "TIMEOUT" : "FAILED",
          new Date().toISOString(),
          undefined,
          code
        );
        this.fail(delivery.id, delivery.claim_token, now, attemptNumber, code);
        return "RETRY";
      } finally {
        clearTimeout(timer);
      }
    } finally {
      this.running = false;
    }
  }

  private fail(id: number, token: string, now: Date, attempt: number, code: string) {
    const delaySeconds = Math.min(3600, 30 * 2 ** Math.max(0, attempt - 1));
    const retryAt = new Date(now.getTime() + delaySeconds * 1000).toISOString();
    this.repository.recordFailure(id, token, new Date().toISOString(), code, retryAt);
  }
}
