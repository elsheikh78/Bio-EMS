import { AppError } from "../../errors/app-error";

type ProvisionerRequest = {
  method?: "GET" | "POST";
  body?: object;
  timeoutMs?: number;
};

function unavailable(message: string) {
  return new AppError(message, 503, "DEVICE_PROVISIONER_UNAVAILABLE");
}

export class DeviceProvisioningLocalClient {
  constructor(private readonly environment: NodeJS.ProcessEnv = process.env) {}

  private settings() {
    const url = this.environment.BIOEMS_PROVISIONER_URL?.trim();
    const token = this.environment.BIOEMS_PROVISIONER_TOKEN?.trim();
    if (!url || !token) throw unavailable("Local device provisioner is not configured");
    if (!/^http:\/\/127\.0\.0\.1:\d+$/.test(url)) {
      throw unavailable("Local device provisioner URL is not loopback-only");
    }
    return { url, token };
  }

  private async request<T>(path: string, input: ProvisionerRequest = {}): Promise<T> {
    const { url, token } = this.settings();
    try {
      const response = await fetch(`${url}${path}`, {
        method: input.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          ...(input.body ? { "Content-Type": "application/json" } : {}),
        },
        body: input.body ? JSON.stringify(input.body) : undefined,
        signal: AbortSignal.timeout(input.timeoutMs ?? 15_000),
      });
      const payload = (await response.json()) as unknown;
      if (!response.ok) {
        throw unavailable(
          `Local device provisioner rejected the operation with HTTP ${response.status}`
        );
      }
      return payload as T;
    } catch (error) {
      if (error instanceof AppError) throw error;
      const message = error instanceof Error ? error.message : "unknown local provisioner error";
      throw unavailable(`Local device provisioner request failed: ${message}`);
    }
  }

  health() {
    return this.request<{
      status: "UP";
      target: "ESP32-S3";
      esptoolReady: boolean;
      firmwareReady: boolean;
    }>("/health");
  }

  simHealth() {
    return this.request<{
      toolReady: boolean;
      firmwareReady: boolean;
      firmwareVersion: string | null;
    }>("/sim/health");
  }

  simDetect(port: string) {
    return this.request<{
      port: string;
      supported: boolean;
      chip: string | null;
      baud: number | null;
    }>("/sim/detect", { method: "POST", body: { port }, timeoutMs: 40000 });
  }

  scanSims(port: string) {
    return this.request<object>("/sim/scan", { method: "POST", body: { port }, timeoutMs: 30000 });
  }

  simFlash(port: string, firmwareVersion: string) {
    return this.request<{ port: string; firmwareVersion: string; toolOutput: string }>(
      "/sim/flash",
      {
        method: "POST",
        body: { port, firmwareVersion },
        timeoutMs: 150_000,
      }
    );
  }

  ports() {
    return this.request<{
      ports: Array<{
        port: string;
        name: string | null;
        pnpDeviceId: string | null;
        manufacturer: string | null;
      }>;
    }>("/ports");
  }

  detect(port: string) {
    return this.request<{
      port: string;
      chip: string | null;
      supported: boolean;
      toolOutput: string;
    }>("/detect", { method: "POST", body: { port }, timeoutMs: 30_000 });
  }

  flash(port: string) {
    return this.request<{
      port: string;
      firmwareVersion: string;
      protocolVersion: string;
      bindingSchemaVersion: number;
      toolOutput: string;
    }>("/flash", { method: "POST", body: { port }, timeoutMs: 210_000 });
  }

  provision(
    port: string,
    input: {
      wifiSsid: string;
      wifiPassword: string;
      platformUrl: string;
      pairingCode: string;
    }
  ) {
    return this.request<{
      port: string;
      hardwareUid: string;
      platformBindingId: string;
      installationId: string;
      deviceId: string;
      siteCode: string;
      toolOutput: string;
    }>("/provision", {
      method: "POST",
      body: { port, ...input },
      timeoutMs: 90_000,
    });
  }
}

export const deviceProvisioningLocalClient = new DeviceProvisioningLocalClient();
