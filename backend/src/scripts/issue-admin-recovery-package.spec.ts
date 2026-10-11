import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import { runIssueAdminRecoveryPackage } from "./issue-admin-recovery-package";
import { verifyAdminRecoveryPermit } from "../modules/admin-recovery/admin-recovery.domain";
import { parseOwnerCommissioningTrustedKeyring } from "../modules/platform-auth/owner-commissioning-trust";
const directories: string[] = [];
afterEach(() => {
  directories.forEach((path) => rmSync(path, { recursive: true, force: true }));
  directories.length = 0;
  vi.restoreAllMocks();
});
describe("standalone ADMIN recovery issuer", () => {
  it("generates an encrypted independent key, exports public trust, and issues without knowing a password", () => {
    const directory = mkdtempSync(join(tmpdir(), "admin-recovery-test-"));
    directories.push(directory);
    const env = {
      BIOEMS_ADMIN_RECOVERY_MODE: "generate-key",
      BIOEMS_ADMIN_RECOVERY_PRIVATE_KEY: join(directory, "key.pem"),
      BIOEMS_ADMIN_RECOVERY_PASSPHRASE: "RecoveryKeyPassphrase2026!",
      BIOEMS_ADMIN_RECOVERY_KEY_ID: "admin-test-2026",
      BIOEMS_ADMIN_RECOVERY_OUTPUT: join(directory, "trust.json"),
    };
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(runIssueAdminRecoveryPackage(env)).toBe(0);
    expect(readFileSync(env.BIOEMS_ADMIN_RECOVERY_PRIVATE_KEY, "utf8")).toContain(
      "BEGIN ENCRYPTED PRIVATE KEY"
    );
    const trust = parseOwnerCommissioningTrustedKeyring(
      JSON.parse(readFileSync(env.BIOEMS_ADMIN_RECOVERY_OUTPUT, "utf8")) as unknown
    );
    const requestPath = join(directory, "request.json");
    const now = new Date("2026-10-11T12:00:00.000Z");
    writeFileSync(
      requestPath,
      JSON.stringify({
        schemaVersion: 1,
        purpose: "CUSTOMER_ADMIN_RECOVERY_REQUEST",
        requestId: randomUUID(),
        installationId: randomUUID(),
        username: "admin",
        customerName: "C",
        customerCode: "C1",
        siteName: "S",
        siteCode: "S1",
        challenge: "a".repeat(43),
        requestedAt: now.toISOString(),
        expiresAt: "2026-10-12T12:00:00.000Z",
      })
    );
    const issue = {
      ...env,
      BIOEMS_ADMIN_RECOVERY_MODE: "issue",
      BIOEMS_ADMIN_RECOVERY_REQUEST: requestPath,
      BIOEMS_ADMIN_RECOVERY_OUTPUT: join(directory, "permit.json"),
    };
    expect(runIssueAdminRecoveryPackage(issue, now)).toBe(0);
    const signed: unknown = JSON.parse(readFileSync(issue.BIOEMS_ADMIN_RECOVERY_OUTPUT, "utf8"));
    expect(verifyAdminRecoveryPermit(signed, trust.keys[0].publicKeyPem, now).claims.username).toBe(
      "admin"
    );
    expect(runIssueAdminRecoveryPackage(issue, now)).toBe(1);
    expect(
      runIssueAdminRecoveryPackage(
        {
          ...issue,
          BIOEMS_ADMIN_RECOVERY_OUTPUT: join(directory, "wrong.json"),
          BIOEMS_ADMIN_RECOVERY_PASSPHRASE: "wrong",
        },
        now
      )
    ).toBe(1);
    expect(JSON.stringify(log.mock.calls)).not.toContain(env.BIOEMS_ADMIN_RECOVERY_PASSPHRASE);
    expect(JSON.stringify(signed)).not.toContain("PRIVATE KEY");
  });
});
