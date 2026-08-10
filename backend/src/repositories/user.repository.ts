import type Database from "better-sqlite3";
import { sqlite } from "../../database/sqlite/client";
import { CreateUserRecord, normalizeUsername, User, UserCredentialRecord } from "../entities/User";

const BCRYPT_HASH_PATTERN = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/;
const MINIMUM_BCRYPT_COST = 12;
const MAXIMUM_BCRYPT_COST = 31;

const PUBLIC_USER_COLUMNS = `
  id,
  username,
  email,
  role,
  status,
  created_at,
  updated_at
`;

export class UserRepository {
  constructor(private readonly database: Database.Database = sqlite) {}

  create(user: CreateUserRecord): number {
    assertValidBcryptHash(user.passwordHash);

    const statement = this.database.prepare(`
      INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        status
      )
      VALUES (?, ?, ?, ?, ?)
    `);

    const result = statement.run(
      normalizeUsername(user.username),
      user.email ?? null,
      user.passwordHash,
      user.role,
      user.status ?? "active"
    );

    return Number(result.lastInsertRowid);
  }

  createFirstUser(user: CreateUserRecord): number {
    return this.database.transaction(() => {
      const existing = this.database.prepare("SELECT 1 FROM users LIMIT 1").get();

      if (existing) {
        throw new Error("User bootstrap conflict");
      }

      return this.create(user);
    })();
  }

  getAll(): User[] {
    return this.database
      .prepare(`SELECT ${PUBLIC_USER_COLUMNS} FROM users ORDER BY id`)
      .all() as User[];
  }

  findByUsername(username: string): User | undefined {
    return this.database
      .prepare(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE username = ? LIMIT 1`)
      .get(normalizeUsername(username)) as User | undefined;
  }

  findById(id: number): User | undefined {
    return this.database
      .prepare(`SELECT ${PUBLIC_USER_COLUMNS} FROM users WHERE id = ? LIMIT 1`)
      .get(id) as User | undefined;
  }

  findCredentialsByUsername(username: string): UserCredentialRecord | undefined {
    return this.database
      .prepare(`SELECT ${PUBLIC_USER_COLUMNS}, password_hash FROM users WHERE username = ? LIMIT 1`)
      .get(normalizeUsername(username)) as UserCredentialRecord | undefined;
  }
}

function assertValidBcryptHash(passwordHash: string): void {
  const match = BCRYPT_HASH_PATTERN.exec(passwordHash);
  const cost = match ? Number(match[1]) : Number.NaN;

  if (!match || cost < MINIMUM_BCRYPT_COST || cost > MAXIMUM_BCRYPT_COST) {
    throw new Error("Invalid bcrypt password hash");
  }
}
