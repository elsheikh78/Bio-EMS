import { describe, expect, it, vi } from "vitest";
import { runBootstrapSystemOwnerCommand } from "./bootstrap-system-owner";

describe("bootstrap SYSTEM_OWNER command", () => {
  it("always rejects direct local bootstrap", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    expect(runBootstrapSystemOwnerCommand()).toBe(1);
    expect(error).toHaveBeenCalledWith(
      "Direct System Owner bootstrap is disabled. Use a manufacturer-signed commissioning package."
    );
    error.mockRestore();
  });
});
