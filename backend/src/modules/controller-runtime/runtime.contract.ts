import { z } from "zod";

export const CONTROLLER_RUNTIME_CONTRACT_VERSION = 1 as const;
export const CONTROLLER_RUNTIME_NAME = "bio-ems-site-controller" as const;

export const controllerHardwareProfileSchema = z.enum(["STANDARD", "ADVANCED"]);
export type ControllerHardwareProfile = z.infer<typeof controllerHardwareProfileSchema>;

export const controllerRuntimeIdentitySchema = z
  .object({
    runtime_name: z.literal(CONTROLLER_RUNTIME_NAME),
    runtime_version: z.string().trim().min(1).max(64),
    build_id: z.string().trim().min(1).max(128),
    hardware_profile: controllerHardwareProfileSchema,
  })
  .strict();
export type ControllerRuntimeIdentity = z.infer<typeof controllerRuntimeIdentitySchema>;

export const controllerBoundarySchema = z
  .object({
    controller_id: z.string().trim().min(1).max(100),
    site_uuid: z.string().uuid(),
    config_contract_version: z.literal(CONTROLLER_RUNTIME_CONTRACT_VERSION),
  })
  .strict();
export type ControllerBoundary = z.infer<typeof controllerBoundarySchema>;

export const acknowledgedConfigIdentitySchema = z
  .object({
    site_uuid: z.string().uuid(),
    config_version: z.number().int().positive(),
    checksum_sha256: z.string().regex(/^[a-f0-9]{64}$/),
  })
  .strict();
export type AcknowledgedConfigIdentity = z.infer<typeof acknowledgedConfigIdentitySchema>;

export const controllerBootInputSchema = z
  .object({
    identity: controllerRuntimeIdentitySchema,
    boundary: controllerBoundarySchema,
    persisted_config: acknowledgedConfigIdentitySchema.nullable(),
    primary_transport_available: z.boolean(),
  })
  .strict();
export type ControllerBootInput = z.infer<typeof controllerBootInputSchema>;

export type ControllerRuntimeState =
  | "BOOTING"
  | "READY_ONLINE"
  | "READY_OFFLINE"
  | "NOT_READY_NO_CONFIG"
  | "NOT_READY_SITE_MISMATCH"
  | "RESTART_REQUIRED";

export interface ControllerRuntimeSnapshot {
  identity: ControllerRuntimeIdentity;
  boundary: ControllerBoundary;
  state: ControllerRuntimeState;
  primary_transport_available: boolean;
  effective_config: AcknowledgedConfigIdentity | null;
  watchdog: {
    timeout_ms: number;
    last_heartbeat_at_ms: number;
    restart_count: number;
  };
}
