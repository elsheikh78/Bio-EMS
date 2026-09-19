import { createHash, createPublicKey, generateKeyPairSync } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  parseOwnerCommissioningTrustedKeyring,
  resolveOwnerCommissioningPublicKey,
} from "./owner-commissioning-trust";

describe("owner commissioning trusted keyring", () => {
  const ed25519PublicKey = generateKeyPairSync("ed25519").publicKey.export({
    format: "pem",
    type: "spki",
  }) as string;

  it("pins the approved manufacturer public key fingerprint", () => {
    const approvedPublicKeyPem =
      "-----BEGIN PUBLIC KEY-----\nMCowBQYDK2VwAyEA8a91/WEJzQneF8VIOsf9hN8MBy5MW0TqubhhsX5i8Oo=\n-----END PUBLIC KEY-----\n";
    const der = createPublicKey(approvedPublicKeyPem).export({
      format: "der",
      type: "spki",
    });
    expect(createHash("sha256").update(der).digest("hex")).toBe(
      "495ae8e780a32b671518f06a371612b884327e899b67ca0483a21813be50fb81"
    );
  });

  it("resolves only an active Ed25519 key by its immutable key ID", () => {
    const keyring = parseOwnerCommissioningTrustedKeyring({
      schemaVersion: 1,
      keys: [
        {
          keyId: "owner-primary-2026",
          publicKeyPem: ed25519PublicKey,
          status: "active",
        },
      ],
    });

    expect(resolveOwnerCommissioningPublicKey(keyring, "owner-primary-2026")).toBe(
      ed25519PublicKey
    );
    expect(() => resolveOwnerCommissioningPublicKey(keyring, "attacker-key")).toThrow(
      "not trusted"
    );
  });

  it("rejects revoked, duplicate, and non-Ed25519 trust entries", () => {
    const revoked = parseOwnerCommissioningTrustedKeyring({
      schemaVersion: 1,
      keys: [
        {
          keyId: "owner-revoked-2026",
          publicKeyPem: ed25519PublicKey,
          status: "revoked",
        },
      ],
    });
    expect(() => resolveOwnerCommissioningPublicKey(revoked, "owner-revoked-2026")).toThrow(
      "not trusted"
    );

    expect(() =>
      parseOwnerCommissioningTrustedKeyring({
        schemaVersion: 1,
        keys: [
          {
            keyId: "duplicate-key",
            publicKeyPem: ed25519PublicKey,
            status: "active",
          },
          {
            keyId: "duplicate-key",
            publicKeyPem: ed25519PublicKey,
            status: "active",
          },
        ],
      })
    ).toThrow();

    const rsaPublicKey = generateKeyPairSync("rsa", {
      modulusLength: 2048,
    }).publicKey.export({ format: "pem", type: "spki" });
    expect(() =>
      parseOwnerCommissioningTrustedKeyring({
        schemaVersion: 1,
        keys: [
          {
            keyId: "wrong-algorithm",
            publicKeyPem: rsaPublicKey,
            status: "active",
          },
        ],
      })
    ).toThrow("must be Ed25519");
  });
});
