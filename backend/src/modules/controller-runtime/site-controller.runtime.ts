import {
  acknowledgedConfigIdentitySchema,
  controllerBootInputSchema,
  type ControllerBootInput,
  type ControllerRuntimeSnapshot,
  type ControllerRuntimeState,
} from "./runtime.contract";
import { receiveConfigEnvelope, type ConfigReceiptResult } from "./config-receipt.service";
import type { DurableConfigStore } from "./durable-config.store";

const DEFAULT_WATCHDOG_TIMEOUT_MS = 30_000;

export class SiteControllerRuntime {
  private snapshotValue: ControllerRuntimeSnapshot;

  private constructor(
    snapshot: ControllerRuntimeSnapshot,
    private readonly durableConfigStore: DurableConfigStore | null
  ) {
    this.snapshotValue = snapshot;
  }

  static boot(
    input: unknown,
    nowMs = Date.now(),
    durableConfigStore: DurableConfigStore | null = null
  ): SiteControllerRuntime {
    const parsed = controllerBootInputSchema.parse(input);
    const recoveredConfig = durableConfigStore?.load(
      parsed.boundary.controller_id,
      parsed.boundary.site_uuid
    );
    const persistedConfig = recoveredConfig ?? parsed.persisted_config;
    const bootInput: ControllerBootInput = { ...parsed, persisted_config: persistedConfig };

    return new SiteControllerRuntime(
      {
        identity: parsed.identity,
        boundary: parsed.boundary,
        state: initialState(bootInput),
        primary_transport_available: parsed.primary_transport_available,
        effective_config:
          persistedConfig?.site_uuid === parsed.boundary.site_uuid ? persistedConfig : null,
        watchdog: {
          timeout_ms: DEFAULT_WATCHDOG_TIMEOUT_MS,
          last_heartbeat_at_ms: nowMs,
          restart_count: 0,
        },
      },
      durableConfigStore
    );
  }

  snapshot(): ControllerRuntimeSnapshot {
    return structuredClone(this.snapshotValue);
  }

  heartbeat(nowMs = Date.now()): ControllerRuntimeSnapshot {
    if (this.snapshotValue.state !== "RESTART_REQUIRED") {
      this.snapshotValue.watchdog.last_heartbeat_at_ms = nowMs;
    }
    return this.snapshot();
  }

  setPrimaryTransportAvailable(available: boolean): ControllerRuntimeSnapshot {
    this.snapshotValue.primary_transport_available = available;
    this.snapshotValue.state = deriveReadyState(this.snapshotValue);
    return this.snapshot();
  }

  setAcknowledgedConfig(input: unknown): ControllerRuntimeSnapshot {
    const config = acknowledgedConfigIdentitySchema.parse(input);
    if (config.site_uuid !== this.snapshotValue.boundary.site_uuid) {
      this.snapshotValue.effective_config = null;
      this.snapshotValue.state = "NOT_READY_SITE_MISMATCH";
      return this.snapshot();
    }

    this.snapshotValue.effective_config = config;
    this.snapshotValue.state = deriveReadyState(this.snapshotValue);
    return this.snapshot();
  }

  receiveConfigEnvelope(envelope: unknown, acknowledgedAt: string): ConfigReceiptResult {
    const result = receiveConfigEnvelope({
      controller_id: this.snapshotValue.boundary.controller_id,
      site_uuid: this.snapshotValue.boundary.site_uuid,
      current_config: this.snapshotValue.effective_config,
      envelope,
      acknowledged_at: acknowledgedAt,
    });

    if (result.acknowledgement.status === "APPLIED" && result.accepted_config) {
      this.durableConfigStore?.save(
        this.snapshotValue.boundary.controller_id,
        result.accepted_config,
        acknowledgedAt
      );
      this.snapshotValue.effective_config = result.accepted_config;
      this.snapshotValue.state = deriveReadyState(this.snapshotValue);
    }

    return result;
  }

  watchdogCheck(nowMs = Date.now()): ControllerRuntimeSnapshot {
    if (
      nowMs - this.snapshotValue.watchdog.last_heartbeat_at_ms >
      this.snapshotValue.watchdog.timeout_ms
    ) {
      this.snapshotValue.state = "RESTART_REQUIRED";
    }
    return this.snapshot();
  }

  restart(nowMs = Date.now()): ControllerRuntimeSnapshot {
    const restartCount = this.snapshotValue.watchdog.restart_count + 1;
    this.snapshotValue.watchdog = {
      ...this.snapshotValue.watchdog,
      last_heartbeat_at_ms: nowMs,
      restart_count: restartCount,
    };
    this.snapshotValue.state = deriveReadyState(this.snapshotValue);
    return this.snapshot();
  }
}

function initialState(input: ControllerBootInput): ControllerRuntimeState {
  if (input.persisted_config && input.persisted_config.site_uuid !== input.boundary.site_uuid) {
    return "NOT_READY_SITE_MISMATCH";
  }
  if (!input.persisted_config) return "NOT_READY_NO_CONFIG";
  return input.primary_transport_available ? "READY_ONLINE" : "READY_OFFLINE";
}

function deriveReadyState(snapshot: ControllerRuntimeSnapshot): ControllerRuntimeState {
  if (!snapshot.effective_config) return "NOT_READY_NO_CONFIG";
  return snapshot.primary_transport_available ? "READY_ONLINE" : "READY_OFFLINE";
}
