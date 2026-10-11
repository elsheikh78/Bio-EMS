import { randomBytes, randomUUID } from "node:crypto";
import type Database from "better-sqlite3";
import { AppError } from "../../errors/app-error";
import { normalizeUsername } from "../../entities/User";
import { hashPassword } from "../../services/password.service";
import { PasswordRecoveryRepository } from "../../repositories/password-recovery.repository";
import {
  parseOwnerCommissioningTrustedKeyring,
  resolveOwnerCommissioningPublicKey,
} from "../platform-auth/owner-commissioning-trust";
import {
  adminRecoveryPackageSchema,
  adminRecoveryRequestSchema,
  recoveryHash,
  verifyAdminRecoveryPermit,
} from "./admin-recovery.domain";

type Identity = {
  installationId: string;
  customer: { name: string; code: string };
  site: { name: string; code: string };
};
type Row = {
  request_id: string;
  installation_id: string;
  username: string;
  user_id: number | null;
  credential_hash: string | null;
  challenge_hash: string;
  expires_at: string;
  status: string;
  grant_expires_at: string | null;
  signing_key_id: string | null;
};
const rejected = () =>
  new AppError(
    "Recovery authorization is invalid, expired or already used",
    400,
    "ADMIN_RECOVERY_REJECTED"
  );

export class AdminRecoveryService {
  constructor(
    private readonly database: Database.Database,
    private readonly identity: () => Identity,
    private readonly trustedKeys: () => unknown,
    private readonly now: () => Date = () => new Date()
  ) {}

  request(usernameInput: string) {
    const identity = this.identity();
    const now = this.now();
    const username = normalizeUsername(usernameInput);
    const user = this.database
      .prepare("SELECT id,password_hash,role,status FROM users WHERE username=?")
      .get(username) as
      { id: number; password_hash: string; role: string; status: string } | undefined;
    const eligible = user?.role === "ADMIN" && user.status === "active";
    // Same shape for missing, inactive and non-ADMIN users. Company verifies the requester.
    const request = adminRecoveryRequestSchema.parse({
      schemaVersion: 1,
      purpose: "CUSTOMER_ADMIN_RECOVERY_REQUEST",
      requestId: randomUUID(),
      installationId: identity.installationId,
      username,
      customerName: identity.customer.name,
      customerCode: identity.customer.code,
      siteName: identity.site.name,
      siteCode: identity.site.code,
      challenge: randomBytes(32).toString("base64url"),
      requestedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + 24 * 60 * 60_000).toISOString(),
    });
    this.database.transaction(() => {
      this.database
        .prepare("DELETE FROM admin_offline_recovery WHERE expires_at < ?")
        .run(now.toISOString());
      this.database
        .prepare(
          `INSERT INTO admin_offline_recovery
        (request_id,installation_id,username,user_id,credential_hash,challenge_hash,requested_at,expires_at,status)
        VALUES(?,?,?,?,?,?,?,?,'PENDING')`
        )
        .run(
          request.requestId,
          request.installationId,
          username,
          eligible ? user.id : null,
          eligible ? recoveryHash(user.password_hash) : null,
          recoveryHash(request.challenge),
          request.requestedAt,
          request.expiresAt
        );
      this.audit("ADMIN_OFFLINE_RECOVERY_REQUESTED", request.requestId, null, "PUBLIC");
    })();
    return request;
  }

  authorize(input: unknown) {
    try {
      const candidate = adminRecoveryPackageSchema.parse(input);
      const keyring = parseOwnerCommissioningTrustedKeyring(this.trustedKeys());
      const publicKey = resolveOwnerCommissioningPublicKey(keyring, candidate.keyId);
      const verified = verifyAdminRecoveryPermit(candidate, publicKey, this.now());
      const claims = verified.claims;
      const token = randomBytes(32).toString("base64url");
      const expiry = new Date(
        Math.min(Date.parse(claims.expiresAt), this.now().getTime() + 10 * 60_000)
      ).toISOString();
      this.database.transaction(() => {
        const row = this.database
          .prepare("SELECT * FROM admin_offline_recovery WHERE request_id=?")
          .get(claims.requestId) as Row | undefined;
        this.assertUsable(row);
        if (
          row!.username !== claims.username ||
          row!.installation_id !== claims.installationId ||
          row!.challenge_hash !== claims.challengeHash
        )
          throw rejected();
        this.database
          .prepare(
            `UPDATE admin_offline_recovery SET status='APPROVED',grant_hash=?,grant_expires_at=?,signing_key_id=? WHERE request_id=?`
          )
          .run(recoveryHash(token), expiry, candidate.keyId, claims.requestId);
        this.audit(
          "ADMIN_OFFLINE_RECOVERY_AUTHORIZED",
          claims.requestId,
          row!.user_id,
          candidate.keyId
        );
      })();
      return { recoveryToken: token, expiresAt: expiry, username: claims.username };
    } catch {
      throw rejected();
    }
  }

  async complete(token: string, newPassword: string) {
    // Validate/hash before opening a synchronous SQLite transaction. Recheck grant after hashing.
    const passwordHash = await hashPassword(newPassword);
    this.database.transaction(() => {
      const row = this.database
        .prepare("SELECT * FROM admin_offline_recovery WHERE grant_hash=? AND status='APPROVED'")
        .get(recoveryHash(token)) as Row | undefined;
      this.assertUsable(row);
      if (!row!.grant_expires_at || Date.parse(row!.grant_expires_at) <= this.now().getTime())
        throw rejected();
      // Revocation of the trusted key applies to already-issued restricted grants too.
      resolveOwnerCommissioningPublicKey(
        parseOwnerCommissioningTrustedKeyring(this.trustedKeys()),
        row!.signing_key_id!
      );
      const consumed = this.database
        .prepare(
          "UPDATE admin_offline_recovery SET status='CONSUMED',grant_hash=NULL,consumed_at=? WHERE request_id=? AND status='APPROVED'"
        )
        .run(this.now().toISOString(), row!.request_id);
      if (consumed.changes !== 1) throw rejected();
      this.database
        .prepare(
          "UPDATE users SET password_hash=?,password_change_required=0,updated_at=CURRENT_TIMESTAMP WHERE id=? AND role='ADMIN' AND status='active'"
        )
        .run(passwordHash, row!.user_id);
      this.audit(
        "ADMIN_OFFLINE_PASSWORD_RESET",
        row!.request_id,
        row!.user_id,
        row!.signing_key_id!
      );
    })();
    return { success: true };
  }

  private assertUsable(row: Row | undefined) {
    if (
      !row ||
      row.status === "CONSUMED" ||
      row.installation_id !== this.identity().installationId ||
      Date.parse(row.expires_at) <= this.now().getTime() ||
      !row.user_id
    )
      throw rejected();
    const user = this.database
      .prepare("SELECT username,password_hash,role,status FROM users WHERE id=?")
      .get(row.user_id) as
      { username: string; password_hash: string; role: string; status: string } | undefined;
    if (
      !user ||
      user.role !== "ADMIN" ||
      user.status !== "active" ||
      user.username !== row.username ||
      recoveryHash(user.password_hash) !== row.credential_hash
    )
      throw rejected();
  }

  private audit(eventType: string, requestId: string, userId: number | null, actor: string) {
    new PasswordRecoveryRepository(this.database).recordAudit({
      eventType,
      requestId,
      principalType: "USER",
      principalId: userId,
      actorType: actor === "PUBLIC" ? "PUBLIC" : "MANUFACTURER_SIGNING_AUTHORITY",
      actorId: actor === "PUBLIC" ? null : actor,
      outcome: "SUCCESS",
    });
  }
}
