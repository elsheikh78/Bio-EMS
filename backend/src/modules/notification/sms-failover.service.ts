import { createHash } from "node:crypto";
import {
  assertE164Recipient,
  SmsFailoverGateway,
  SmsFailoverRequest,
  SmsFailoverResult,
} from "./sms-failover.contract";
import { evaluateSmsFailover } from "./sms-failover.policy";

export class SmsFailoverService {
  constructor(private readonly gateway: SmsFailoverGateway) {}

  async attempt(request: SmsFailoverRequest): Promise<SmsFailoverResult> {
    const decision = evaluateSmsFailover(request.event, request.primaryCommunication);
    if (!decision.eligible) {
      return { status: "NOT_ELIGIBLE", reason: decision.reason };
    }

    assertE164Recipient(request.recipient);
    const recipientFingerprint = createHash("sha256")
      .update(request.recipient)
      .digest("hex")
      .slice(0, 16);
    const idempotencyKey = `sms:${request.event.deduplicationKey}:${recipientFingerprint}`;

    try {
      const receipt = await this.gateway.send({
        event: request.event,
        recipient: request.recipient,
        idempotencyKey,
      });
      return { status: "SENT", idempotencyKey, receipt };
    } catch {
      return { status: "FAILED", idempotencyKey };
    }
  }
}
