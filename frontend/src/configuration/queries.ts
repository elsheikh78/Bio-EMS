import { useMutation } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { useRefreshSensorsAfterMutation } from "../monitoredAreas/queries";
import { createConfigurationApi } from "./api";
import type {
  UpdateSensorAlarmDelayInput,
  UpdateSensorThresholdsInput,
} from "./contracts";

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
