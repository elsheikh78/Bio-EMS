import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useSites } from "../monitoredAreas/queries";
import {
  useCreateNotificationRecipient,
  useNotificationRecipients,
  useUpdateNotificationRecipient,
  useUpdateNotificationRecipientStatus,
} from "./queries";
import { NotificationRecipientsPanel } from "./NotificationRecipientsPanel";

vi.mock("../monitoredAreas/queries", () => ({ useSites: vi.fn() }));
vi.mock("./queries", () => ({
  useNotificationRecipients: vi.fn(),
  useCreateNotificationRecipient: vi.fn(),
  useUpdateNotificationRecipient: vi.fn(),
  useUpdateNotificationRecipientStatus: vi.fn(),
}));

const mockedSites = vi.mocked(useSites);
const mockedRecipients = vi.mocked(useNotificationRecipients);
const mockedCreate = vi.mocked(useCreateNotificationRecipient);
const mockedUpdate = vi.mocked(useUpdateNotificationRecipient);
const mockedStatus = vi.mocked(useUpdateNotificationRecipientStatus);
const createRecipient = vi.fn();
const updateRecipient = vi.fn();
const updateStatus = vi.fn();
function renderForSite() {
  const view = render(<NotificationRecipientsPanel />);
  fireEvent.mouseDown(screen.getByLabelText("Site"));
  fireEvent.click(screen.getByRole("option", { name: "Cairo (CAI)" }));
  return view;
}
const recipient = {
  id: 1,
  uuid: "11111111-1111-4111-8111-111111111111",
  site_id: 7,
  display_name: "Quality manager",
  role: "QUALITY" as const,
  status: "active" as const,
  created_at: "2026-08-24T00:00:00Z",
  updated_at: null,
  endpoints: [
    {
      id: 1,
      channel: "EMAIL" as const,
      address: "quality@example.com",
      eligible_severities: ["WARNING" as const, "CRITICAL" as const],
    },
  ],
};

describe("NotificationRecipientsPanel", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedSites.mockReturnValue({
      data: [{ id: 7, code: "CAI", name: "Cairo" }],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useSites>);
    mockedRecipients.mockReturnValue({
      data: [recipient],
      isPending: false,
      isError: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useNotificationRecipients>);
    mockedCreate.mockReturnValue({
      mutateAsync: createRecipient,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useCreateNotificationRecipient>);
    mockedUpdate.mockReturnValue({
      mutateAsync: updateRecipient,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateNotificationRecipient>);
    mockedStatus.mockReturnValue({
      mutateAsync: updateStatus,
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useUpdateNotificationRecipientStatus>);
    vi.stubGlobal("crypto", {
      randomUUID: () => "22222222-2222-4222-8222-222222222222",
    });
  });

  it("lists Site-scoped recipients without presenting contact addresses", () => {
    renderForSite();
    expect(mockedRecipients).toHaveBeenCalledWith(7);
    expect(screen.getByText("Quality manager")).toBeInTheDocument();
    expect(screen.getByText("EMAIL: WARNING/CRITICAL")).toBeInTheDocument();
    expect(screen.queryByText("quality@example.com")).not.toBeInTheDocument();
  });

  it("changes lifecycle status through the dedicated mutation", () => {
    renderForSite();
    fireEvent.click(screen.getByRole("button", { name: "Deactivate" }));
    expect(updateStatus).toHaveBeenCalledWith({
      uuid: recipient.uuid,
      status: "inactive",
    });
  });

  it("validates contact values before create", () => {
    renderForSite();
    fireEvent.click(screen.getByRole("button", { name: "Add recipient" }));
    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: "Duty engineer" },
    });
    fireEvent.change(screen.getByLabelText(/EMAIL address/), {
      target: { value: "invalid" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save recipient" }));
    expect(screen.getByText("Email address is invalid.")).toBeInTheDocument();
    expect(createRecipient).not.toHaveBeenCalled();
  });

  it("creates a normalized recipient for the selected Site", async () => {
    createRecipient.mockResolvedValue(recipient);
    renderForSite();
    fireEvent.click(screen.getByRole("button", { name: "Add recipient" }));
    fireEvent.change(screen.getByLabelText(/Display name/), {
      target: { value: " Duty engineer " },
    });
    fireEvent.change(screen.getByLabelText(/EMAIL address/), {
      target: { value: " duty@example.com " },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save recipient" }));
    await waitFor(() =>
      expect(createRecipient).toHaveBeenCalledWith({
        uuid: "22222222-2222-4222-8222-222222222222",
        site_id: 7,
        display_name: "Duty engineer",
        role: "PRIMARY_CONTACT",
        endpoints: [
          {
            channel: "EMAIL",
            address: "duty@example.com",
            eligible_severities: ["WARNING", "CRITICAL"],
          },
        ],
      }),
    );
  });

  it("shows empty and recoverable load failure states", () => {
    mockedRecipients.mockReturnValue({
      data: [],
      isPending: false,
      isError: false,
    } as unknown as ReturnType<typeof useNotificationRecipients>);
    const { rerender } = renderForSite();
    expect(screen.getByText(/No notification recipients/)).toBeInTheDocument();
    const refetch = vi.fn();
    mockedRecipients.mockReturnValue({
      isPending: false,
      isError: true,
      refetch,
    } as unknown as ReturnType<typeof useNotificationRecipients>);
    rerender(<NotificationRecipientsPanel />);
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refetch).toHaveBeenCalledOnce();
  });
});
