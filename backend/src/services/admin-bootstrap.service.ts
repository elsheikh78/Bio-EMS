import type Database from "better-sqlite3";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword } from "./password.service";

const DEFAULT_CUSTOMER_CODE = "INSTALLATION-CUSTOMER";
const DEFAULT_CUSTOMER_NAME = "BIO-EMS Customer";
const BOOTSTRAP_ACTOR = "INSTALLER_ADMIN_BOOTSTRAP";

export interface BootstrapAdminInput {
  username: string;
  password: string;
  email?: string;
  customerCode: string;
  customerName: string;
}

export interface BootstrapLogger {
  info(message: string): void;
}

export interface BootstrapAdminDependencies {
  database: Database.Database;
  userRepository: UserRepository;
  logger: BootstrapLogger;
}

export class BootstrapAdminError extends Error {
  constructor() {
    super("Administrator bootstrap failed");
    this.name = "BootstrapAdminError";
  }
}

export function readBootstrapAdminEnvironment(environment: NodeJS.ProcessEnv): BootstrapAdminInput {
  const username = environment.BIOEMS_BOOTSTRAP_ADMIN_USERNAME;
  const password = environment.BIOEMS_BOOTSTRAP_ADMIN_PASSWORD;
  const email = environment.BIOEMS_BOOTSTRAP_ADMIN_EMAIL;

  if (!username || !password) {
    throw new BootstrapAdminError();
  }

  return {
    username,
    password,
    email: email || undefined,
    customerCode: environment.BIOEMS_BOOTSTRAP_CUSTOMER_CODE || DEFAULT_CUSTOMER_CODE,
    customerName: environment.BIOEMS_BOOTSTRAP_CUSTOMER_NAME || DEFAULT_CUSTOMER_NAME,
  };
}

export async function bootstrapAdmin(
  input: BootstrapAdminInput,
  dependencies: BootstrapAdminDependencies
): Promise<number> {
  try {
    const passwordHash = await hashPassword(input.password);
    const now = new Date().toISOString();

    const id = dependencies.database.transaction(() => {
      const customerId = Number(
        dependencies.database
          .prepare(
            `INSERT INTO platform_customers (code,name,status,created_at,created_by)
             VALUES (?,?, 'ACTIVE', ?, ?)`
          )
          .run(input.customerCode.trim(), input.customerName.trim(), now, BOOTSTRAP_ACTOR)
          .lastInsertRowid
      );

      const userId = dependencies.userRepository.createFirstUser({
        username: input.username,
        email: input.email,
        passwordHash,
        role: "ADMIN",
        status: "active",
      });

      dependencies.database
        .prepare(
          `INSERT INTO customer_user_bindings (customer_id,user_id,bound_at,bound_by)
           VALUES (?,?,?,?)`
        )
        .run(customerId, userId, now, BOOTSTRAP_ACTOR);

      const binding = dependencies.database
        .prepare(
          `SELECT 1 AS present
           FROM customer_user_bindings
           WHERE customer_id = ? AND user_id = ?`
        )
        .get(customerId, userId) as { present: number } | undefined;

      if (!binding) throw new Error("Customer administrator binding was not created");
      return userId;
    })();

    dependencies.logger.info("Bootstrap customer administrator created and bound");
    return id;
  } catch {
    throw new BootstrapAdminError();
  }
}
