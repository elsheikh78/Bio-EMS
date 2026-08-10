import { describe, expect, it, vi } from "vitest";
import { runBootstrapAdminCommand } from "./bootstrap-admin";

describe("bootstrap ADMIN command", () => {
  it("returns a non-zero exit code for invalid environment without exposing secrets", async () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      runBootstrapAdminCommand({ BIOEMS_BOOTSTRAP_ADMIN_PASSWORD: "MissingUsername1" })
    ).resolves.toBe(1);
    expect(error).toHaveBeenCalledWith("Administrator bootstrap failed");
    expect(error.mock.calls.flat().join(" ")).not.toContain("MissingUsername1");
    error.mockRestore();
  });
});
