import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppErrorBoundary } from "./AppErrorBoundary";

function BrokenChild(): never {
  throw new Error("render failure");
}

describe("AppErrorBoundary", () => {
  afterEach(() => vi.restoreAllMocks());

  it("renders a recovery action when a child fails", () => {
    vi.spyOn(console, "error").mockImplementation(() => undefined);

    render(
      <AppErrorBoundary
        fallbackCopy={{
          title: "Localized startup failure",
          reload: "Try again",
        }}
      >
        <BrokenChild />
      </AppErrorBoundary>,
    );

    expect(
      screen.getByRole("heading", { name: "Localized startup failure" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Try again" }),
    ).toBeInTheDocument();
  });
});
