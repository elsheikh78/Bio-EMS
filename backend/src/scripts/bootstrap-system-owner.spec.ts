import { describe, expect, it, vi } from "vitest";
import { runBootstrapSystemOwnerCommand } from "./bootstrap-system-owner";

describe("bootstrap SYSTEM_OWNER command", () => {
  it("returns a non-zero exit code for invalid environment without exposing secrets", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      runBootstrapSystemOwnerCommand({
        BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD: "MissingUsernameOwnerPassword1",
      })
    ).resolves.toBe(1);
    expect(error).toHaveBeenCalledWith("System owner bootstrap failed");
    expect(error.mock.calls.flat().join(" ")).not.toContain("MissingUsernameOwnerPassword1");
    error.mockRestore();
  });
});
