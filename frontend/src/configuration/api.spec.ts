import { describe, expect, it, vi } from "vitest";
import { createConfigurationApi } from "./api";

const sensor = {
  uuid: "8ae946c2-1424-44e8-b98d-ae2fd2f2273e",
  room_id: 1,
  device_id: 1,
  channel: 1,
  code: "TEMP-01",
  name: "Temperature",
  sensor_type: "TEMPERATURE",
  unit: "°C",
  warning_delay_seconds: 30,
  critical_delay_seconds: 10,
};
const recipient = {
  id: 1,
  uuid: "b3d90e36-faf5-4a46-96dc-376dbc1475cb",
  site_id: 7,
  display_name: "Quality",
  role: "QUALITY",
  status: "active",
  created_at: "2026-08-24 08:00:00",
  updated_at: null,
  endpoints: [
    {
      id: 1,
      channel: "SMS",
      address: "+201001234567",
      eligible_severities: ["CRITICAL"],
    },
  ],
};
const policy = {
  id: 1,
  uuid: "0d432ea8-e6a6-4f73-a952-d10800710471",
  site_id: 7,
  name: "Critical",
  owner_role: "QUALITY",
  eligible_severities: ["CRITICAL"],
  status: "active",
  created_at: "2026-08-24 08:00:00",
  updated_at: null,
  steps: [
    {
      id: 1,
      position: 1,
      delay_seconds: 0,
      recipient_role: "PRIMARY_CONTACT",
      channels: ["SMS"],
    },
  ],
};

describe("configuration protected API adapter", () => {
  it("maps Sensor threshold and delay mutations to their approved routes", async () => {
    const request = vi.fn().mockResolvedValue(sensor);
    const api = createConfigurationApi(request);

    await api.updateSensorThresholds(sensor.uuid, { alarm_high: 10 });
    await api.updateSensorAlarmDelay(sensor.uuid, {
      critical_delay_seconds: 10,
    });

    expect(request).toHaveBeenNthCalledWith(
      1,
      `/sensors/${sensor.uuid}/thresholds`,
      expect.objectContaining({ method: "PATCH", body: '{"alarm_high":10}' }),
    );
    expect(request).toHaveBeenNthCalledWith(
      2,
      `/sensors/${sensor.uuid}/alarm-delay`,
      expect.objectContaining({
        method: "PATCH",
        body: '{"critical_delay_seconds":10}',
      }),
    );
  });

  it("maps recipient list/create/update/status without exposing contacts in URLs", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce([recipient])
      .mockResolvedValue(recipient);
    const api = createConfigurationApi(request);

    await api.listRecipients(7);
    await api.createRecipient({
      uuid: recipient.uuid,
      site_id: 7,
      display_name: "Quality",
      role: "QUALITY",
      endpoints: [
        {
          channel: "SMS",
          address: "+201001234567",
          eligible_severities: ["CRITICAL"],
        },
      ],
    });
    await api.updateRecipient(recipient.uuid, { display_name: "QA" });
    await api.updateRecipientStatus(recipient.uuid, "inactive");

    expect(request.mock.calls.map(([path]) => String(path))).toEqual([
      "/notification-recipients?site_id=7",
      "/notification-recipients",
      `/notification-recipients/${recipient.uuid}`,
      `/notification-recipients/${recipient.uuid}/status`,
    ]);
    expect(
      request.mock.calls.map(([path]) => String(path)).join(" "),
    ).not.toContain("+201001234567");
  });

  it("maps escalation lifecycle and rejects malformed responses", async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce([policy])
      .mockResolvedValue(policy);
    const api = createConfigurationApi(request);

    await api.listEscalationPolicies(7);
    await api.createEscalationPolicy({
      uuid: policy.uuid,
      site_id: 7,
      name: "Critical",
      owner_role: "QUALITY",
      eligible_severities: ["CRITICAL"],
      steps: [
        {
          position: 1,
          delay_seconds: 0,
          recipient_role: "PRIMARY_CONTACT",
          channels: ["SMS"],
        },
      ],
    });
    await api.updateEscalationPolicy(policy.uuid, { name: "Updated" });
    await api.updateEscalationPolicyStatus(policy.uuid, "inactive");

    expect(request.mock.calls.map(([path]) => String(path))).toEqual([
      "/escalation-policies?site_id=7",
      "/escalation-policies",
      `/escalation-policies/${policy.uuid}`,
      `/escalation-policies/${policy.uuid}/status`,
    ]);

    const malformed = createConfigurationApi(
      vi.fn().mockResolvedValue({ id: 1 }),
    );
    await expect(malformed.listRecipients(7)).rejects.toThrow();
  });
});
