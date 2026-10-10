import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SystemUpdatePage } from "./SystemUpdatePage";
const { request } = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("../auth/useAuthentication", () => ({
  useAuthentication: () => ({ protectedRequest: request }),
}));
vi.mock("../localization/useLocalization", () => ({
  useLocalization: () => ({ language: "en" }),
}));
function show() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <SystemUpdatePage />
    </QueryClientProvider>,
  );
}
describe("Client system update", () => {
  beforeEach(() => request.mockReset());
  it("disables cloud downloads and requires an upload before installing", async () => {
    request.mockResolvedValue({
      installedVersion: "0.20.0",
      sourceCommit: "a".repeat(40),
      internetEnabled: false,
      latestJob: null,
    });
    show();
    await screen.findByText(/Installed version: 0.20.0/);
    expect(
      screen.getByRole("button", { name: "Check and download update" }),
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Upload and verify" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("button", { name: /Install update/ }),
    ).not.toBeInTheDocument();
  });
  it("installs only the verified job displayed by the server", async () => {
    request.mockResolvedValue({
      installedVersion: "0.20.0",
      sourceCommit: "a".repeat(40),
      internetEnabled: false,
      latestJob: {
        jobId: "job-1",
        state: "PREPARED",
        version: "0.21.0",
        sha256: "b".repeat(64),
      },
    });
    show();
    fireEvent.click(
      await screen.findByRole("button", { name: /Install update/ }),
    );
    await waitFor(() =>
      expect(request).toHaveBeenCalledWith("/platform-updates/job-1/apply", {
        method: "POST",
      }),
    );
  });
  it("keeps controls disabled while the independent worker is applying", async () => {
    request.mockResolvedValue({
      installedVersion: "0.20.0",
      sourceCommit: "a".repeat(40),
      internetEnabled: false,
      latestJob: { jobId: "job-1", state: "APPLYING", version: "0.21.0" },
    });
    show();
    await screen.findByText("Installing");
    expect(
      screen.getByRole("button", { name: "Choose update file" }),
    ).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByText(/Keep the PC powered on/)).toBeInTheDocument();
  });
});
