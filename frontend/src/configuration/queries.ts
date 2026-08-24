import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { useRefreshSensorsAfterMutation } from "../monitoredAreas/queries";
import { createConfigurationApi } from "./api";
import type {
  UpdateSensorAlarmDelayInput,
  UpdateSensorThresholdsInput,
  CreateNotificationRecipientInput,
  UpdateNotificationRecipientInput,
  CreateEscalationPolicyInput,
  UpdateEscalationPolicyInput,
} from "./contracts";

export const configurationQueryKeys = {
  all: ["configuration"] as const,
  recipients: (siteId: number) =>
    [...configurationQueryKeys.all, "recipients", siteId] as const,
  policies: (siteId: number) =>
    [...configurationQueryKeys.all, "policies", siteId] as const,
};

export function useUpdateSensorThresholds(sensorUuid?: string) {
  const { protectedRequest } = useAuthentication();
  const refreshSensors = useRefreshSensorsAfterMutation();
  const api = createConfigurationApi(protectedRequest);

  return useMutation({
    mutationFn: (input: UpdateSensorThresholdsInput) =>
      api.updateSensorThresholds(sensorUuid!, input),
    onSuccess: refreshSensors,
  });
}

export function useUpdateSensorAlarmDelay(sensorUuid?: string) {
  const { protectedRequest } = useAuthentication();
  const refreshSensors = useRefreshSensorsAfterMutation();
  const api = createConfigurationApi(protectedRequest);

  return useMutation({
    mutationFn: (input: UpdateSensorAlarmDelayInput) =>
      api.updateSensorAlarmDelay(sensorUuid!, input),
    onSuccess: refreshSensors,
  });
}

export function useNotificationRecipients(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  return useQuery({
    queryKey: configurationQueryKeys.recipients(siteId ?? 0),
    queryFn: () => api.listRecipients(siteId!),
    enabled: Boolean(siteId),
  });
}

function useRefreshRecipients(siteId?: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: configurationQueryKeys.recipients(siteId ?? 0),
    });
}

export function useCreateNotificationRecipient(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshRecipients(siteId);
  return useMutation({
    mutationFn: (input: CreateNotificationRecipientInput) =>
      api.createRecipient(input),
    onSuccess: refresh,
  });
}

export function useUpdateNotificationRecipient(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshRecipients(siteId);
  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string;
      input: UpdateNotificationRecipientInput;
    }) => api.updateRecipient(uuid, input),
    onSuccess: refresh,
  });
}

export function useUpdateNotificationRecipientStatus(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshRecipients(siteId);
  return useMutation({
    mutationFn: ({
      uuid,
      status,
    }: {
      uuid: string;
      status: "active" | "inactive";
    }) => api.updateRecipientStatus(uuid, status),
    onSuccess: refresh,
  });
}

export function useEscalationPolicies(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  return useQuery({
    queryKey: configurationQueryKeys.policies(siteId ?? 0),
    queryFn: () => api.listEscalationPolicies(siteId!),
    enabled: Boolean(siteId),
  });
}

function useRefreshPolicies(siteId?: number) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: configurationQueryKeys.policies(siteId ?? 0),
    });
}

export function useCreateEscalationPolicy(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshPolicies(siteId);
  return useMutation({
    mutationFn: (input: CreateEscalationPolicyInput) =>
      api.createEscalationPolicy(input),
    onSuccess: refresh,
  });
}

export function useUpdateEscalationPolicy(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshPolicies(siteId);
  return useMutation({
    mutationFn: ({
      uuid,
      input,
    }: {
      uuid: string;
      input: UpdateEscalationPolicyInput;
    }) => api.updateEscalationPolicy(uuid, input),
    onSuccess: refresh,
  });
}

export function useUpdateEscalationPolicyStatus(siteId?: number) {
  const { protectedRequest } = useAuthentication();
  const api = createConfigurationApi(protectedRequest);
  const refresh = useRefreshPolicies(siteId);
  return useMutation({
    mutationFn: ({
      uuid,
      status,
    }: {
      uuid: string;
      status: "active" | "inactive";
    }) => api.updateEscalationPolicyStatus(uuid, status),
    onSuccess: refresh,
  });
}
