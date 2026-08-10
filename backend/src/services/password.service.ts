import bcrypt from "bcrypt";

export const BCRYPT_COST = 12;

const MINIMUM_PASSWORD_CHARACTERS = 12;
const MAXIMUM_PASSWORD_BYTES = 72;

export class PasswordPolicyError extends Error {
  constructor() {
    super("Password does not meet security requirements");
    this.name = "PasswordPolicyError";
  }
}

export async function hashPassword(password: string): Promise<string> {
  assertPasswordPolicy(password);
  return bcrypt.hash(password, BCRYPT_COST);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  if (!isPasswordPolicyCompliant(password) || !isStructurallyValidBcryptHash(passwordHash)) {
    return false;
  }

  try {
    return await bcrypt.compare(password, passwordHash);
  } catch {
    return false;
  }
}

function assertPasswordPolicy(password: string): void {
  if (!isPasswordPolicyCompliant(password)) {
    throw new PasswordPolicyError();
  }
}

function isPasswordPolicyCompliant(password: string): boolean {
  return (
    [...password].length >= MINIMUM_PASSWORD_CHARACTERS &&
    Buffer.byteLength(password, "utf8") <= MAXIMUM_PASSWORD_BYTES &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function isStructurallyValidBcryptHash(passwordHash: string): boolean {
  const match = /^\$2[aby]\$(\d{2})\$[./A-Za-z0-9]{53}$/.exec(passwordHash);
  const cost = match ? Number(match[1]) : Number.NaN;
  return Boolean(match && cost >= BCRYPT_COST && cost <= 31);
}
