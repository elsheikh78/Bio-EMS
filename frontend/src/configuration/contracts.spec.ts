import { describe, expect, it } from "vitest";
import {
  escalationPolicySchema,
  notificationRecipientSchema,
} from "./contracts";

const recipient = {
  id: 1,
  uuid: "b3d90e36-faf5-4a46-96dc-376dbc1475cb",
  site_id: 7,
  display_name: "Quality contact",
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
  id: 2,
  uuid: "0d432ea8-e6a6-4f73-a952-d10800710471",
  site_id: 7,
  name: "Critical escalation",
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

describe("configuration runtime contracts", () => {
  it("accepts the approved recipient and escalation response shapes", () => {
    expect(notificationRecipientSchema.parse(recipient)).toEqual(recipient);
    expect(escalationPolicySchema.parse(policy)).toEqual(policy);
  });

  it("rejects unknown fields and unsupported backend vocabulary", () => {
    expect(() =>
      notificationRecipientSchema.parse({
        ...recipient,
        secret: "not-approved",
      }),
    ).toThrow();
    expect(() =>
      escalationPolicySchema.parse({ ...policy, owner_role: "ADMIN" }),
    ).toThrow();
    expect(() =>
      escalationPolicySchema.parse({
        ...policy,
        steps: [{ ...policy.steps[0], channels: ["PUSH"] }],
      }),
    ).toThrow();
  });
});
