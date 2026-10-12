import { generateKeyPairSync } from "node:crypto";
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { stageAdminRecoveryTrust } from "./stage-admin-recovery-trust";

const directories: string[] = [];
afterEach(() =>
  directories.splice(0).forEach((directory) => rmSync(directory, { recursive: true, force: true }))
);
function input(keyType: "ed25519" | "rsa" = "ed25519") {
  const directory = mkdtempSync(join(tmpdir(), "recovery-trust-stage-"));
  directories.push(directory);
  const pair =
    keyType === "ed25519"
      ? generateKeyPairSync("ed25519")
      : generateKeyPairSync("rsa", { modulusLength: 2048 });
  const value = {
    schemaVersion: 1,
    keys: [
      {
        keyId: "company-recovery",
        status: "active",
        publicKeyPem: pair.publicKey.export({ format: "pem", type: "spki" }).toString(),
      },
    ],
  };
  const source = join(directory, "trust.json");
  const destination = join(directory, "staged.json");
  writeFileSync(source, JSON.stringify(value));
  return { source, destination, value, pair };
}
describe("company recovery public trust packaging", () => {
  it("stages exactly the approved public keyring without generating a key", () => {
    const fixture = input();
    stageAdminRecoveryTrust(fixture.source, fixture.destination);
    expect(JSON.parse(readFileSync(fixture.destination, "utf8"))).toEqual(fixture.value);
    expect(readFileSync(fixture.destination, "utf8")).not.toContain("PRIVATE KEY");
  });
  it("rejects private PEM even though Node can derive a public key from it", () => {
    const fixture = input();
    fixture.value.keys[0].publicKeyPem = fixture.pair.privateKey
      .export({ format: "pem", type: "pkcs8" })
      .toString();
    writeFileSync(fixture.source, JSON.stringify(fixture.value));
    expect(() => stageAdminRecoveryTrust(fixture.source, fixture.destination)).toThrow();
    expect(existsSync(fixture.destination)).toBe(false);
  });
  it("rejects non-Ed25519 keys and oversized input", () => {
    const fixture = input("rsa");
    expect(() => stageAdminRecoveryTrust(fixture.source, fixture.destination)).toThrow();
    writeFileSync(fixture.source, " ".repeat(65537));
    expect(() => stageAdminRecoveryTrust(fixture.source, fixture.destination)).toThrow();
  });
  it("rejects revoked-only, duplicate, malformed and extra-field keyrings", () => {
    const fixture = input();
    for (const value of [
      { ...fixture.value, keys: [{ ...fixture.value.keys[0], status: "revoked" }] },
      { ...fixture.value, keys: [fixture.value.keys[0], fixture.value.keys[0]] },
      { ...fixture.value, privateKeyPem: "secret" },
      { ...fixture.value, keys: [{ ...fixture.value.keys[0], publicKeyPem: "invalid" }] },
    ]) {
      writeFileSync(fixture.source, JSON.stringify(value));
      expect(() => stageAdminRecoveryTrust(fixture.source, fixture.destination)).toThrow();
      expect(existsSync(fixture.destination)).toBe(false);
    }
  });
});
