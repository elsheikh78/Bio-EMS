/**
 * BIO-EMS
 * Domain Message Keys
 *
 * Centralized localization keys used by the Domain layer.
 *
 * NOTE:
 * The Domain returns message keys only.
 * Localization is performed by the Application/UI layer.
 */

export const AlarmMessageKeys = {
  UNKNOWN: "alarm.unknown",

  NORMAL: "alarm.normal",

  LOW: "alarm.low",

  HIGH: "alarm.high",

  CRITICAL_LOW: "alarm.critical.low",

  CRITICAL_HIGH: "alarm.critical.high",

  OFFLINE: "alarm.offline",
} as const;

export type AlarmMessageKey =
  (typeof AlarmMessageKeys)[keyof typeof AlarmMessageKeys];