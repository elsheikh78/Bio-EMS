import { generateKeyPairSync, randomUUID } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { KeyProtector } from "./key-protection";

export interface InstallationIdentityEnvelope {
  schemaVersion: 1;
  installationId: string;
  algorithm: "Ed25519";
  publicKeyPem: string;
  protectedPrivateKey: string;
  protection: string;
  createdAt: string;
}

export class InstallationIdentityService {
  constructor(
    private readonly path: string,
    private readonly protector: KeyProtector
  ) {}

  create(now = new Date()): InstallationIdentityEnvelope {
    const { publicKey, privateKey } = generateKeyPairSync("ed25519");
    const envelope: InstallationIdentityEnvelope = {
      schemaVersion: 1,
      installationId: randomUUID(),
      algorithm: "Ed25519",
      publicKeyPem: publicKey.export({ type: "spki", format: "pem" }).toString(),
      protectedPrivateKey: this.protector
        .protect(privateKey.export({ type: "pkcs8", format: "der" }))
        .toString("base64"),
      protection: this.protector.protection,
      createdAt: now.toISOString(),
    };
    mkdirSync(dirname(this.path), { recursive: true, mode: 0o700 });
    writeFileSync(this.path, JSON.stringify(envelope), {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
    chmodSync(this.path, 0o600);
    return envelope;
  }

  load(): InstallationIdentityEnvelope {
    const envelope = JSON.parse(readFileSync(this.path, "utf8")) as InstallationIdentityEnvelope;
    if (envelope.schemaVersion !== 1 || envelope.algorithm !== "Ed25519") {
      throw new Error("Unsupported installation identity envelope");
    }
    return envelope;
  }

  loadPrivateKeyDer(): Buffer {
    return this.protector.unprotect(Buffer.from(this.load().protectedPrivateKey, "base64"));
  }
}
