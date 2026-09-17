import "dotenv/config";
import { randomBytes } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { z } from "zod";
import { createOwnerRecoveryId, hashOwnerRecoveryChallenge, ownerRecoveryRequestSchema } from "../modules/platform-auth/owner-recovery";

const identitySchema = z.object({ schemaVersion: z.literal(1), installationId: z.string().uuid() }).passthrough();

export async function runCreateOwnerRecoveryRequest(environment: NodeJS.ProcessEnv = process.env, now = new Date()): Promise<number> {
  let database: import("better-sqlite3").Database | undefined;
  try {
    const identityPath = environment.BIOEMS_INSTALLATION_IDENTITY_PATH;
    const outputPath = environment.BIOEMS_OWNER_RECOVERY_REQUEST_OUTPUT;
    if (!identityPath || !outputPath) throw new Error("Owner recovery request paths are required");
    const identity = identitySchema.parse(JSON.parse(readFileSync(identityPath, "utf8")));
    const recoveryId = createOwnerRecoveryId();
    const challenge = randomBytes(32).toString("base64url");
    const request = ownerRecoveryRequestSchema.parse({ schemaVersion: 1, recoveryId, installationId: identity.installationId, challenge, requestedAt: now.toISOString() });
    const [{ sqlite }, { createTables }, { runMigrations }] = await Promise.all([import("../../database/sqlite/client"), import("../../database/sqlite/schema"), import("../../database/sqlite/migration-runner")]);
    database = sqlite;
    createTables(database);
    runMigrations(database);
    const owner = database.prepare(`SELECT id FROM platform_principals WHERE principal_type = 'SYSTEM_OWNER' AND status = 'active' LIMIT 1`).get() as { id: string } | undefined;
    if (!owner) throw new Error("SYSTEM_OWNER is not commissioned");
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
    database.prepare(`INSERT INTO password_recovery_requests (request_id, principal_type, username_hint, installation_id, challenge_hash, status, requested_at, expires_at) VALUES (?, 'SYSTEM_OWNER', NULL, ?, ?, 'PENDING', ?, ?)`).run(recoveryId, identity.installationId, hashOwnerRecoveryChallenge(challenge), now.toISOString(), expiresAt);
    database.prepare(`INSERT INTO password_recovery_audit (event_type, request_id, principal_type, actor_type, outcome, details_json) VALUES ('SYSTEM_OWNER_RECOVERY_REQUESTED', ?, 'SYSTEM_OWNER', 'LOCAL_INSTALLATION', 'SUCCESS', ?)`).run(recoveryId, JSON.stringify({ installation_id: identity.installationId }));
    mkdirSync(dirname(outputPath), { recursive: true, mode: 0o700 });
    writeFileSync(outputPath, `${JSON.stringify(request, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
    console.log("System Owner recovery request created; no credential or private key was included");
    return 0;
  } catch {
    console.error("System Owner recovery request creation failed");
    return 1;
  } finally { database?.close(); }
}

if (require.main === module) void runCreateOwnerRecoveryRequest().then((code) => { process.exitCode = code; });
