import { z } from "zod";
import { NotificationEventInput } from "./notification-event";

export const PRIMARY_COMMUNICATION_STATES = ["AVAILABLE", "UNAVAILABLE"] as const;
export type PrimaryCommunicationState = (typeof PRIMARY_COMMUNICATION_STATES)[number];

export const SMS_FAILOVER_REASONS = {
  PRIMARY_AVAILABLE: "PRIMARY_AVAILABLE",
  CRITICAL_ALARM_DURING_OUTAGE: "CRITICAL_ALARM_DURING_OUTAGE",
  DEVICE_OFFLINE_DURING_OUTAGE: "DEVICE_OFFLINE_DURING_OUTAGE",
  EVENT_NOT_ELIGIBLE: "EVENT_NOT_ELIGIBLE",
} as const;

export type SmsFailoverReason = (typeof SMS_FAILOVER_REASONS)[keyof typeof SMS_FAILOVER_REASONS];

export interface SmsFailoverDecision {
  eligible: boolean;
  reason: SmsFailoverReason;
}

export interface SmsFailoverRequest {
  event: NotificationEventInput;
  primaryCommunication: PrimaryCommunicationState;
  recipient: string;
}

export interface SmsGatewayRequest {
  event: NotificationEventInput;
  recipient: string;
  idempotencyKey: string;
}

export interface SmsGatewayReceipt {
  providerMessageId: string;
  acceptedAt: string;
}

export interface SmsFailoverGateway {
  send(request: SmsGatewayRequest): Promise<SmsGatewayReceipt>;
}

export type SmsFailoverResult =
  | { status: "NOT_ELIGIBLE"; reason: SmsFailoverReason }
  | { status: "SENT"; idempotencyKey: string; receipt: SmsGatewayReceipt }
  | { status: "FAILED"; idempotencyKey: string };

const e164Schema = z.string().regex(/^\+[1-9]\d{7,14}$/);

export function assertE164Recipient(recipient: string): void {
  if (!e164Schema.safeParse(recipient).success) {
    throw new TypeError("SMS failover recipient must use E.164 format");
  }
}
