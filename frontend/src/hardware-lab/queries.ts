import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import {
  hardwareLabProfileSchema,
  hardwareLabRunDetailSchema,
  hardwareLabRunsSchema,
} from "./contracts";

export const hardwareLabKey = ["platform", "hardware-lab"] as const;
export const hardwareLabRunsKey = [...hardwareLabKey, "runs"] as const;

export function useHardwareLabProfile() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: [...hardwareLabKey, "profile"],
    enabled: status === "authenticated",
    queryFn: async () =>
      hardwareLabProfileSchema.parse(
        await apiClient.request<unknown>("/platform-operations/hardware-lab/profile", {
          auth: "protected",
        }),
      ),
  });
}

export function useHardwareLabRuns() {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: hardwareLabRunsKey,
    enabled: status === "authenticated",
    queryFn: async () =>
      hardwareLabRunsSchema.parse(
        await apiClient.request<unknown>("/platform-operations/hardware-lab/runs", {
          auth: "protected",
        }),
      ),
  });
}

export function useHardwareLabRun(runId?: string) {
  const { apiClient, status } = usePlatformAuthentication();
  return useQuery({
    queryKey: [...hardwareLabRunsKey, runId],
    enabled: status === "authenticated" && Boolean(runId),
    queryFn: async () =>
      hardwareLabRunDetailSchema.parse(
        await apiClient.request<unknown>(
          `/platform-operations/hardware-lab/runs/${runId}`,
          { auth: "protected" },
        ),
      ),
  });
}

function useRunMutation<T>(
  path: (input: T) => `/${string}`,
  body: (input: T) => Record<string, unknown> | undefined,
) {
  const { apiClient } = usePlatformAuthentication();
  const cache = useQueryClient();
  return useMutation({
    mutationFn: async (input: T) =>
      hardwareLabRunDetailSchema.parse(
        await apiClient.request<unknown>(path(input), {
          method: "POST",
          auth: "protected",
          headers: body(input) === undefined ? undefined : { "Content-Type": "application/json" },
          body: body(input) === undefined ? undefined : JSON.stringify(body(input)),
        }),
      ),
    onSuccess: async (result) => {
      cache.setQueryData([...hardwareLabRunsKey, result.run.id], result);
      await cache.invalidateQueries({ queryKey: hardwareLabRunsKey });
    },
  });
}

export function useCreateHardwareLabRun() {
  return useRunMutation<
    { main_hardware_uid?: string; sim_serial?: string; notes?: string }
  >(
    () => "/platform-operations/hardware-lab/runs",
    (input) => ({ prototype_type: "MAIN16_SIMD4", ...input }),
  );
}

export const useStartHardwareLabStep = () =>
  useRunMutation<{ runId: string; stepCode: string }>(
    (input) =>
      `/platform-operations/hardware-lab/runs/${input.runId}/steps/${input.stepCode}/start`,
    () => undefined,
  );

export const useRecordHardwareLabStepResult = () =>
  useRunMutation<{
    runId: string;
    stepCode: string;
    status: "PASS" | "FAIL";
    notes?: string;
    metrics: Array<{
      key: string;
      value_real?: number;
      value_text?: string;
      unit?: string;
      channel?: string;
    }>;
  }>(
    (input) =>
      `/platform-operations/hardware-lab/runs/${input.runId}/steps/${input.stepCode}/result`,
    ({ status, notes, metrics }) => ({ status, notes, metrics }),
  );

export const useRecordHardwareLabFirmware = () =>
  useRunMutation<{
    runId: string;
    target: "MAIN16" | "SIMD4" | "SITE_CONTROLLER";
    firmware_name: string;
    version: string;
    git_commit?: string;
    sha256?: string;
    chip: string;
    port?: string;
    flash_status: "PENDING" | "PASS" | "FAIL";
    tool_output?: string;
  }>(
    (input) => `/platform-operations/hardware-lab/runs/${input.runId}/firmware`,
    (input) => {
      const { runId, ...payload } = input;
      void runId;
      return payload;
    },
  );

export const useRecordHardwareLabEvent = () =>
  useRunMutation<{
    runId: string;
    step_code?: string;
    event_code: string;
    expected?: string;
    observed?: string;
    severity: "INFO" | "WARNING" | "ERROR";
  }>(
    (input) => `/platform-operations/hardware-lab/runs/${input.runId}/events`,
    (input) => {
      const { runId, ...payload } = input;
      void runId;
      return payload;
    },
  );

export const useFinalizeHardwareLabRun = () =>
  useRunMutation<{ runId: string }>(
    (input) => `/platform-operations/hardware-lab/runs/${input.runId}/finalize`,
    () => undefined,
  );
