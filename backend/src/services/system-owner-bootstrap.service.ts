import { randomUUID } from "crypto";
import { PlatformPrincipalRepository } from "../repositories/platform-principal.repository";
import { hashPassword } from "./password.service";

export interface BootstrapSystemOwnerInput {
  username: string;
  password: string;
}

export interface SystemOwnerBootstrapLogger {
  info(message: string): void;
}

export interface BootstrapSystemOwnerDependencies {
  platformPrincipalRepository: PlatformPrincipalRepository;
  logger: SystemOwnerBootstrapLogger;
  generateId?: () => string;
}

export class BootstrapSystemOwnerError extends Error {
  constructor() {
    super("System owner bootstrap failed");
    this.name = "BootstrapSystemOwnerError";
  }
}

export function readBootstrapSystemOwnerEnvironment(
  environment: NodeJS.ProcessEnv
): BootstrapSystemOwnerInput {
  const username = environment.BIOEMS_BOOTSTRAP_SYSTEM_OWNER_USERNAME;
  const password = environment.BIOEMS_BOOTSTRAP_SYSTEM_OWNER_PASSWORD;

  if (!username || !password) {
    throw new BootstrapSystemOwnerError();
  }

  return { username, password };
}

export async function bootstrapSystemOwner(
  input: BootstrapSystemOwnerInput,
  dependencies: BootstrapSystemOwnerDependencies
): Promise<string> {
  try {
    const passwordHash = await hashPassword(input.password);
    const principal = dependencies.platformPrincipalRepository.createSystemOwner({
      id: dependencies.generateId?.() ?? randomUUID(),
      username: input.username,
      passwordHash,
    });

    dependencies.logger.info("System owner created");
    return principal.id;
  } catch {
    throw new BootstrapSystemOwnerError();
  }
}
