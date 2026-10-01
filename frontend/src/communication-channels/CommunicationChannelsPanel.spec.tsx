import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { describe, it, expect, vi } from "vitest";
import { CommunicationChannelsPanel } from "./CommunicationChannelsPanel";
function renderPanel(saved: boolean) {
  const request = vi.fn(
    async (_path: string, options?: { method?: string; body?: string }) => {
      if (options?.method === "PUT") return {};
      return {
        channels: saved
          ? [
              {
                config: {
                  channel: "EMAIL",
                  enabled: false,
                  priority: 1,
                  host: "smtp.example.com",
                  port: 587,
                  security: "STARTTLS",
                  senderName: "BIO EMS",
                  senderAddress: "sender@example.com",
                  username: "sender",
                },
                secretsConfigured: true,
              },
            ]
          : [],
      };
    },
  );
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CommunicationChannelsPanel
        request={request as never}
        basePath="/communication-channels"
        sites={[{ id: 1, code: "SITE", name: "Site" }]}
      />
    </QueryClientProvider>,
  );
  return request;
}
describe("Sender readiness", () => {
  it("does not present defaults as a configured sender", async () => {
    renderPanel(false);
    expect(
      await screen.findByText(/This channel is not configured/),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Send test" })).toBeDisabled();
  });
  it("preserves a saved disabled boolean when saving", async () => {
    const request = renderPanel(true);
    await screen.findByText(/The saved channel is disabled/);
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(request.mock.calls.some((call) => call[1]?.method === "PUT")).toBe(
        true,
      ),
    );
    const put = request.mock.calls.find((call) => call[1]?.method === "PUT")!;
    expect(JSON.parse(put[1]!.body!).config.enabled).toBe(false);
  });
});
