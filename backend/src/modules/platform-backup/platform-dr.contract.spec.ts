import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("DEP-BR disaster recovery route contract", () => {
  it("keeps identity transfer owner-only, explicit and audited", async () => {
    const controller = await readFile(
      join(process.cwd(), "src/controllers/platform-backup.controller.ts"),
      "utf8"
    );
    const ownerRoute = await readFile(
      join(process.cwd(), "src/routes/platform-operations.route.ts"),
      "utf8"
    );
    const customerRoute = await readFile(
      join(process.cwd(), "src/routes/platform-backup.route.ts"),
      "utf8"
    );

    expect(ownerRoute).toContain('/:backupId/dr-restore"');
    expect(customerRoute).not.toContain("dr-restore");
    expect(controller).toContain('confirmation !== "TRANSFER_INSTALLATION_IDENTITY"');
    expect(controller).toContain("allowIdentityTransfer: true");
    expect(controller).toContain('action: "PLATFORM_BACKUP.DR_RESTORE"');
    expect(controller).toContain('result: "DENIED"');
    expect(controller).toContain('result: "SUCCESS"');
    expect(controller).toContain('result: "FAILED"');
  });

  it("keeps normal admin and owner restore identity-safe", async () => {
    const controller = await readFile(
      join(process.cwd(), "src/controllers/platform-backup.controller.ts"),
      "utf8"
    );
    const occurrences = controller.match(/allowIdentityTransfer: false/g) ?? [];
    expect(occurrences.length).toBeGreaterThanOrEqual(2);
  });
});
