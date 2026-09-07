import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";

export interface KeyProtector {
  readonly protection: string;
  protect(plaintext: Buffer): Buffer;
  unprotect(ciphertext: Buffer): Buffer;
}

export class AesGcmKeyProtector implements KeyProtector {
  readonly protection = "AES-256-GCM/EXTERNAL-KEK";

  constructor(private readonly key: Buffer) {
    if (key.length !== 32) throw new Error("Installation identity KEK must be exactly 32 bytes");
  }

  static fromBase64(key: string): AesGcmKeyProtector {
    return new AesGcmKeyProtector(Buffer.from(key, "base64"));
  }

  protect(plaintext: Buffer): Buffer {
    const iv = randomBytes(12);
    const cipher = createCipheriv("aes-256-gcm", this.key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    return Buffer.concat([iv, cipher.getAuthTag(), encrypted]);
  }

  unprotect(ciphertext: Buffer): Buffer {
    if (ciphertext.length < 29) throw new Error("Invalid protected installation key envelope");
    const decipher = createDecipheriv("aes-256-gcm", this.key, ciphertext.subarray(0, 12));
    decipher.setAuthTag(ciphertext.subarray(12, 28));
    return Buffer.concat([decipher.update(ciphertext.subarray(28)), decipher.final()]);
  }
}

export class WindowsDpapiKeyProtector implements KeyProtector {
  readonly protection = "WINDOWS-DPAPI/CURRENT-USER";

  protect(plaintext: Buffer): Buffer {
    return this.execute("Protect", plaintext);
  }

  unprotect(ciphertext: Buffer): Buffer {
    return this.execute("Unprotect", ciphertext);
  }

  private execute(operation: "Protect" | "Unprotect", input: Buffer): Buffer {
    if (process.platform !== "win32") throw new Error("Windows DPAPI is only available on Windows");
    const script = `$data=[Convert]::FromBase64String([Console]::In.ReadToEnd());$out=[Security.Cryptography.ProtectedData]::${operation}($data,$null,[Security.Cryptography.DataProtectionScope]::CurrentUser);[Console]::Out.Write([Convert]::ToBase64String($out))`;
    const output = execFileSync(
      "powershell.exe",
      ["-NoProfile", "-NonInteractive", "-Command", script],
      {
        input: input.toString("base64"),
        encoding: "utf8",
        windowsHide: true,
        maxBuffer: 1024 * 1024,
      }
    );
    return Buffer.from(output, "base64");
  }
}

export function createProductionKeyProtector(environment: NodeJS.ProcessEnv): KeyProtector {
  if (process.platform === "win32") return new WindowsDpapiKeyProtector();
  const encodedKek = environment.BIOEMS_INSTALLATION_IDENTITY_KEK;
  if (!encodedKek) throw new Error("BIOEMS_INSTALLATION_IDENTITY_KEK is required outside Windows");
  return AesGcmKeyProtector.fromBase64(encodedKek);
}
