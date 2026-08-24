import type { AuthenticationContextValue } from "../auth/AuthenticationContext";
import { sensorSchema } from "../monitoredAreas/contracts";
import {
  escalationPoliciesSchema,
  escalationPolicySchema,
  notificationRecipientSchema,
  notificationRecipientsSchema,
  type CreateEscalationPolicyInput,
  type CreateNotificationRecipientInput,
  type EscalationPolicy,
  type NotificationRecipient,
  type SensorConfiguration,
  type UpdateEscalationPolicyInput,
  type UpdateNotificationRecipientInput,
  type UpdateSensorAlarmDelayInput,
  type UpdateSensorThresholdsInput,
} from "./contracts";

type ProtectedRequest = AuthenticationContextValue["protectedRequest"];
export interface ConfigurationApi {
  updateSensorThresholds(
    uuid: string,
    input: UpdateSensorThresholdsInput,
  ): Promise<SensorConfiguration>;
  updateSensorAlarmDelay(
    uuid: string,
    input: UpdateSensorAlarmDelayInput,
  ): Promise<SensorConfiguration>;
  listRecipients(siteId: number): Promise<NotificationRecipient[]>;
  createRecipient(
    input: CreateNotificationRecipientInput,
  ): Promise<NotificationRecipient>;
  updateRecipient(
    uuid: string,
    input: UpdateNotificationRecipientInput,
  ): Promise<NotificationRecipient>;
  updateRecipientStatus(
    uuid: string,
    status: "active" | "inactive",
  ): Promise<NotificationRecipient>;
  listEscalationPolicies(siteId: number): Promise<EscalationPolicy[]>;
  createEscalationPolicy(
    input: CreateEscalationPolicyInput,
  ): Promise<EscalationPolicy>;
  updateEscalationPolicy(
    uuid: string,
    input: UpdateEscalationPolicyInput,
  ): Promise<EscalationPolicy>;
  updateEscalationPolicyStatus(
    uuid: string,
    status: "active" | "inactive",
  ): Promise<EscalationPolicy>;
}

export function createConfigurationApi(
  request: ProtectedRequest,
): ConfigurationApi {
  const mutate = async <T>(
    path: `/${string}`,
    method: "POST" | "PATCH",
    body: unknown,
    parse: (value: unknown) => T,
  ) =>
    parse(
      await request<unknown>(path, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }),
    );
  return {
    updateSensorThresholds: (uuid, input) =>
      mutate(`/sensors/${uuid}/thresholds`, "PATCH", input, (value) =>
        sensorSchema.parse(value),
      ),
    updateSensorAlarmDelay: (uuid, input) =>
      mutate(`/sensors/${uuid}/alarm-delay`, "PATCH", input, (value) =>
        sensorSchema.parse(value),
      ),
    async listRecipients(siteId) {
      return notificationRecipientsSchema.parse(
        await request<unknown>(`/notification-recipients?site_id=${siteId}`),
      );
    },
    createRecipient: (input) =>
      mutate("/notification-recipients", "POST", input, (value) =>
        notificationRecipientSchema.parse(value),
      ),
    updateRecipient: (uuid, input) =>
      mutate(`/notification-recipients/${uuid}`, "PATCH", input, (value) =>
        notificationRecipientSchema.parse(value),
      ),
    updateRecipientStatus: (uuid, status) =>
      mutate(
        `/notification-recipients/${uuid}/status`,
        "PATCH",
        { status },
        (value) => notificationRecipientSchema.parse(value),
      ),
    async listEscalationPolicies(siteId) {
      return escalationPoliciesSchema.parse(
        await request<unknown>(`/escalation-policies?site_id=${siteId}`),
      );
    },
    createEscalationPolicy: (input) =>
      mutate("/escalation-policies", "POST", input, (value) =>
        escalationPolicySchema.parse(value),
      ),
    updateEscalationPolicy: (uuid, input) =>
      mutate(`/escalation-policies/${uuid}`, "PATCH", input, (value) =>
        escalationPolicySchema.parse(value),
      ),
    updateEscalationPolicyStatus: (uuid, status) =>
      mutate(
        `/escalation-policies/${uuid}/status`,
        "PATCH",
        { status },
        (value) => escalationPolicySchema.parse(value),
      ),
  };
}
