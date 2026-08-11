import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { App } from "./App";

describe("frontend foundation routing", () => {
  it("renders the foundation placeholder without feature claims", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /frontend foundation/i }),
    ).toBeInTheDocument();
    expect(screen.getByText(/intentionally deferred/i)).toBeInTheDocument();
  });

  it("renders the not-found route", () => {
    render(
      <MemoryRouter initialEntries={["/missing"]}>
        <App />
      </MemoryRouter>,
    );
    expect(
      screen.getByRole("heading", { name: /page not found/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /return to foundation/i }),
    ).toHaveAttribute("href", "/");
  });
});
