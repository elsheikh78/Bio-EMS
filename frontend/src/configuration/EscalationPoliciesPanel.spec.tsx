import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSites } from "../monitoredAreas/queries";
import {
  useCreateEscalationPolicy,
  useEscalationPolicies,
  useUpdateEscalationPolicy,
  useUpdateEscalationPolicyStatus,
} from "./queries";
import { EscalationPoliciesPanel } from "./EscalationPoliciesPanel";

vi.mock("../monitoredAreas/queries", () => ({ useSites: vi.fn() }));
vi.mock("./queries", () => ({
  useEscalationPolicies: vi.fn(),
  useCreateEscalationPolicy: vi.fn(),
  useUpdateEscalationPolicy: vi.fn(),
  useUpdateEscalationPolicyStatus: vi.fn(),
}));
const sites = vi.mocked(useSites);
const policies = vi.mocked(useEscalationPolicies);
const createHook = vi.mocked(useCreateEscalationPolicy);
const updateHook = vi.mocked(useUpdateEscalationPolicy);
const statusHook = vi.mocked(useUpdateEscalationPolicyStatus);
const createPolicy = vi.fn();
const updatePolicy = vi.fn();
const updateStatus = vi.fn();
const policy = {
  id: 1,
  uuid: "11111111-1111-4111-8111-111111111111",
  site_id: 7,
  name: "Critical response",
  owner_role: "QUALITY" as const,
  eligible_severities: ["CRITICAL" as const],
  status: "active" as const,
  created_at: "2026-08-24T00:00:00Z",
  updated_at: null,
  steps: [
    {
      id: 1,
      position: 1,
      delay_seconds: 0,
      recipient_role: "QUALITY" as const,
      channels: ["EMAIL" as const],
    },
  ],
};

describe("EscalationPoliciesPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    sites.mockReturnValue({
      data: [{ id: 7, code: "CAI", name: "Cairo" }],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSites>);
    policies.mockReturnValue({
      data: [policy],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useEscalationPolicies>);
    createHook.mockReturnValue({
      mutateAsync: createPolicy,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateEscalationPolicy>);
    updateHook.mockReturnValue({
      mutateAsync: updatePolicy,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateEscalationPolicy>);
    statusHook.mockReturnValue({
      mutateAsync: updateStatus,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateEscalationPolicyStatus>);
    vi.stubGlobal("crypto", {
      randomUUID: () => "22222222-2222-4222-8222-222222222222",
    });
  });

  it("lists Site-scoped ordered policy evidence", () => {
    render(<EscalationPoliciesPanel />);
    expect(policies).toHaveBeenCalledWith(7);
    expect(screen.getByText("Critical response")).toBeInTheDocument();
    expect(screen.getByText(/Delays: 0s/)).toBeInTheDocument();
  });

  it("uses the dedicated lifecycle mutation", () => {
    render(<EscalationPoliciesPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(updateStatus).toHaveBeenCalledWith({
      uuid: policy.uuid,
      status: "inactive",
    });
  });

  it("rejects non-increasing step delays", () => {
    render(<EscalationPoliciesPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Add policy" }));
    fireEvent.change(screen.getByLabelText(/Policy name/), {
      target: { value: "Warning response" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    fireEvent.change(screen.getByLabelText(/Step 2 delay/), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save policy" }));
    expect(
      screen.getByText("Step delays must increase strictly."),
    ).toBeInTheDocument();
    expect(createPolicy).not.toHaveBeenCalled();
  });

  it("creates contiguous steps with selected channels", async () => {
    createPolicy.mockResolvedValue(policy);
    render(<EscalationPoliciesPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Add policy" }));
    fireEvent.change(screen.getByLabelText(/Policy name/), {
      target: { value: " Warning response " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add step" }));
    fireEvent.click(screen.getAllByLabelText("SMS")[1]);
    fireEvent.click(screen.getByRole("button", { name: "Save policy" }));
    await waitFor(() =>
      expect(createPolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          uuid: "22222222-2222-4222-8222-222222222222",
          site_id: 7,
          name: "Warning response",
          steps: [
            {
              position: 1,
              delay_seconds: 0,
              recipient_role: "PRIMARY_CONTACT",
              channels: ["EMAIL"],
            },
            {
              position: 2,
              delay_seconds: 60,
              recipient_role: "PRIMARY_CONTACT",
              channels: ["EMAIL", "SMS"],
            },
          ],
        }),
      ),
    );
  });

  it("shows empty and recoverable error states", () => {
    policies.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useEscalationPolicies>);
    const { rerender } = render(<EscalationPoliciesPanel />);
    expect(screen.getByText(/No escalation policies/)).toBeInTheDocument();
    const refetch = vi.fn();
    policies.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useEscalationPolicies>);
    rerender(<EscalationPoliciesPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
