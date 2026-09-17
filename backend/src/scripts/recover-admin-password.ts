import "dotenv/config";
import { sqlite } from "../../database/sqlite/client";
import { UserRepository } from "../repositories/user.repository";
import { hashPassword } from "../services/password.service";

export async function recoverAdminPassword(
  environment: NodeJS.ProcessEnv = process.env
): Promise<void> {
  const username = environment.BIOEMS_RECOVERY_ADMIN_USERNAME?.trim();
  const password = environment.BIOEMS_RECOVERY_ADMIN_PASSWORD;

  if (!username || !password) {
    throw new Error("Administrator recovery credentials are required");
  }

  const users = new UserRepository(sqlite);
  const user = users.findByUsername(username);
  if (!user || user.role !== "ADMIN" || user.status !== "active") {
    throw new Error("Active administrator account was not found");
  }

  const passwordHash = await hashPassword(password);
  const updated = users.updatePasswordHash(user.id, passwordHash);
  if (!updated) throw new Error("Administrator password was not updated");
}

if (require.main === module) {
  void recoverAdminPassword()
    .then(() => {
      console.log("BIO-EMS administrator password recovery: PASS");
      sqlite.close();
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : "Administrator recovery failed");
      sqlite.close();
      process.exitCode = 1;
    });
}
