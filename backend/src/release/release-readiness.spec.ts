import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { validateReleasePackage } from "./release-readiness";

function fixture(version = "0.18.0") {
  const root = mkdtempSync(join(tmpdir(), "bio-ems-release-"));
  mkdirSync(join(root, "backend"));
  mkdirSync(join(root, "docs"));
  writeFileSync(join(root, "VERSION"), `${version}\n`);
  writeFileSync(join(root, "backend/package.json"), JSON.stringify({ version }));
  writeFileSync(join(root, "docs/runbook.md"), "controlled\n");
  writeFileSync(
    join(root, "release-manifest.json"),
    JSON.stringify({
      product: "BIO-EMS",
      version,
      components: ["backend", "frontend"],
      requiredDocuments: ["docs/runbook.md"],
      externalAcceptanceRequired: true,
    }),
  );
  return root;
}

describe("release package readiness", () => {
  it("accepts a reconciled controlled package", () => {
    expect(validateReleasePackage(fixture())).toEqual({
      ready: true,
      issues: [],
      version: "0.18.0",
    });
  });

  it("rejects version drift and removal of the external acceptance gate", () => {
    const root = fixture();
    writeFileSync(join(root, "backend/package.json"), JSON.stringify({ version: "0.17.0" }));
    const manifest = JSON.parse(readFile(root, "release-manifest.json"));
    manifest.externalAcceptanceRequired = false;
    writeFileSync(join(root, "release-manifest.json"), JSON.stringify(manifest));
    expect(validateReleasePackage(root).issues).toEqual([
      "backend/package.json version must match VERSION",
      "release manifest must preserve the external acceptance gate",
    ]);
  });
});

function readFile(root: string, relativePath: string): string {
  return readFileSync(join(root, relativePath), "utf8");
}
