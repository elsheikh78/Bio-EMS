import { beforeAll, describe, expect, it, vi } from "vitest";

const { connect, handlers, subscribe } = vi.hoisted(() => {
  const handlers = new Map<string, (...args: unknown[]) => void>();
  return {
    connect: vi.fn(),
    handlers,
    subscribe: vi.fn(),
  };
});

vi.mock("mqtt", () => ({ default: { connect } }));
vi.mock("../config/config", () => ({
  config: {
    mqtt: {
      protocol: "mqtts",
      host: "broker.example.com",
      port: 8883,
      clientId: "bio-ems-pilot",
      username: "backend",
      password: "secret",
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: false,
    },
  },
}));
vi.mock("./router", () => ({ routeMessage: vi.fn() }));

import { getMqttClient } from "./client";

describe("MQTT production client contract", () => {
  beforeAll(() => {
    connect.mockReturnValue({
      on: (name: string, handler: (...args: unknown[]) => void) => handlers.set(name, handler),
      subscribe,
    });
    getMqttClient();
  });

  it("connects through configured TLS identity and reliability options", () => {
    expect(connect).toHaveBeenCalledWith("mqtts://broker.example.com:8883", {
      clientId: "bio-ems-pilot",
      username: "backend",
      password: "secret",
      keepalive: 60,
      reconnectPeriod: 5000,
      connectTimeout: 10000,
      clean: false,
    });
  });

  it("subscribes to implemented telemetry and heartbeat paths at QoS 1", () => {
    handlers.get("connect")?.();

    expect(subscribe).toHaveBeenCalledWith(
      ["bioems/+/telemetry/+", "bioems/+/heartbeat/+"],
      { qos: 1 },
      expect.any(Function)
    );
  });
});
