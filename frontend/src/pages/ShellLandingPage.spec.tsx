import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { useAuthentication } from "../auth/useAuthentication";
import { ShellLandingPage } from "./ShellLandingPage";

vi.mock("../auth/useAuthentication", () => ({ useAuthentication: vi.fn() }));
vi.mock("../localization/useLocalization", () => ({
  useLocalization: () => ({
    resources: { workspace: { title: "Operational workspace" } },
  }),
}));

const authentication = vi.mocked(useAuthentication);

function renderPage(role: "ADMIN" | "OPERATOR" | "VIEWER") {
  authentication.mockReturnValue({
    user: { id: 1, username: role.toLowerCase(), role, status: "active" },
  } as unknown as ReturnType<typeof useAuthentication>);
  render(
    <MemoryRouter>
      <ShellLandingPage />
    </MemoryRouter>,
  );
}

describe("Operational workspace", () => {
  it("exposes authorized operational entry points for ADMIN", () => {
    renderPage("ADMIN");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Operational workspace",
    );
    expect(screen.getAllByRole("link", { name: /Continue/ })).toHaveLength(6);
    expect(screen.getByText("Scheduled in PVR-04")).toBeInTheDocument();
  });

  it("does not expose ADMIN actions to VIEWER", () => {
    renderPage("VIEWER");
    expect(screen.getAllByRole("link", { name: /Continue/ })).toHaveLength(4);
    expect(screen.queryByText("Manage configuration")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Manage users and Audit"),
    ).not.toBeInTheDocument();
  });
});
