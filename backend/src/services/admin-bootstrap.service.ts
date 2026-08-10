import { UserRepository } from "../repositories/user.repository";
import { hashPassword } from "./password.service";

export interface BootstrapAdminInput {
  username: string;
  password: string;
  email?: string;
}

export interface BootstrapLogger {
  info(message: string): void;
}

export interface BootstrapAdminDependencies {
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

  return { username, password, email: email || undefined };
}

export async function bootstrapAdmin(
  input: BootstrapAdminInput,
  dependencies: BootstrapAdminDependencies
): Promise<number> {
  try {
    const passwordHash = await hashPassword(input.password);
    const id = dependencies.userRepository.createFirstUser({
      username: input.username,
      email: input.email,
      passwordHash,
      role: "ADMIN",
      status: "active",
    });

    dependencies.logger.info("Bootstrap administrator created");
    return id;
  } catch {
    throw new BootstrapAdminError();
  }
}
