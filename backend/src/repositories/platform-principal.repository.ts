import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import {
  normalizePlatformUsername,
  PlatformPrincipalCredentialRecord,
  PlatformPrincipalRecord,
} from "../entities/PlatformPrincipal";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/;
const MINIMUM_BCRYPT_COST = 12;
const MAXIMUM_BCRYPT_COST = 31;

const PUBLIC_PLATFORM_PRINCIPAL_COLUMNS = `
  id,
  principal_type,
  username,
  status,
  created_at,
  updated_at
`;

export interface CreateSystemOwnerRecord {
  id: string;
  username: string;
  passwordHash: string;
}

export class PlatformPrincipalRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  createSystemOwner(input: CreateSystemOwnerRecord): PlatformPrincipalCredentialRecord {
    assertValidBcryptHash(input.passwordHash);

    return this.database.transaction(() => {
      const existing = this.database
        .prepare("SELECT 1 FROM platform_principals WHERE principal_type = 'SYSTEM_OWNER' LIMIT 1")
        .get();

      if (existing) {
        throw new Error("SYSTEM_OWNER already exists");
      }

      this.database
        .prepare(`
          INSERT INTO platform_principals (
            id,
            principal_type,
            username,
            password_hash,
            status
          )
          VALUES (?, 'SYSTEM_OWNER', ?, ?, 'active')
        `)
        .run(input.id, normalizePlatformUsername(input.username), input.passwordHash);

      return this.findCredentialsByUsername(input.username)!;
    })();
  }

  findById(id: string): PlatformPrincipalRecord | undefined {
    return this.database
      .prepare(`
        SELECT ${PUBLIC_PLATFORM_PRINCIPAL_COLUMNS}
        FROM platform_principals
        WHERE id = ?
        LIMIT 1
      `)
      .get(id) as PlatformPrincipalRecord | undefined;
  }

  findCredentialsByUsername(username: string): PlatformPrincipalCredentialRecord | undefined {
    return this.database
      .prepare(`
        SELECT
          ${PUBLIC_PLATFORM_PRINCIPAL_COLUMNS},
          password_hash
        FROM platform_principals
        WHERE username = ?
        LIMIT 1
      `)
      .get(normalizePlatformUsername(username)) as PlatformPrincipalCredentialRecord | undefined;
  }
}

function assertValidBcryptHash(passwordHash: string): void {
  const match = BCRYPT_HASH_PATTERN.exec(passwordHash);
  const cost = match ? Number(match[1]) : Number.NaN;

  if (!match || cost < MINIMUM_BCRYPT_COST || cost > MAXIMUM_BCRYPT_COST) {
    throw new Error("Invalid bcrypt password hash");
  }
}
