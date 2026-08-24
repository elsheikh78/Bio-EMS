import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthentication } from "../auth/useAuthentication";
import { createAlarmsApi } from "./api";

export const alarmQueryKeys = { all: ["alarms"] as const };

export function useAlarms() {
  const { protectedRequest } = useAuthentication();
  return useQuery({
    queryKey: alarmQueryKeys.all,
    queryFn: () => createAlarmsApi(protectedRequest).list(),
  });
}

export function useAcknowledgeAlarm() {
  const { protectedRequest } = useAuthentication();
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      createAlarmsApi(protectedRequest).acknowledge(id),
    onSuccess: () => client.invalidateQueries({ queryKey: alarmQueryKeys.all }),
  });
}
