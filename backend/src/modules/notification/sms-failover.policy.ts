import { NotificationEventInput } from "./notification-event";
import {
  SMS_FAILOVER_REASONS,
  SmsFailoverDecision,
  PrimaryCommunicationState,
} from "./sms-failover.contract";

export function evaluateSmsFailover(
  event: NotificationEventInput,
  primaryCommunication: PrimaryCommunicationState
): SmsFailoverDecision {
  if (primaryCommunication === "AVAILABLE") {
    return { eligible: false, reason: SMS_FAILOVER_REASONS.PRIMARY_AVAILABLE };
  }

  if (event.eventType === "DEVICE_OFFLINE") {
    return {
      eligible: true,
      reason: SMS_FAILOVER_REASONS.DEVICE_OFFLINE_DURING_OUTAGE,
    };
  }

  if (event.eventType === "ALARM_TRIGGERED" && event.payload.severity === "CRITICAL") {
    return {
      eligible: true,
      reason: SMS_FAILOVER_REASONS.CRITICAL_ALARM_DURING_OUTAGE,
    };
  }

  return { eligible: false, reason: SMS_FAILOVER_REASONS.EVENT_NOT_ELIGIBLE };
}
