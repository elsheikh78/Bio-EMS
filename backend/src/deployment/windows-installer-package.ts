import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";

const sha256Schema = z.string().regex(/^[a-f0-9]{64}$/);

export const windowsInstallerManifestSchema = z
  .object({
    schemaVersion: z.literal(1),
    product: z.literal("BIO-EMS"),
    productVersion: z.string().regex(/^\d+\.\d+\.\d+$/),
    architecture: z.literal("x64"),
    installerTechnology: z.literal("Inno Setup 6"),
    generatedAt: z.string().datetime(),
    sourceCommit: z.string().regex(/^[a-f0-9]{40}$/),
    artifacts: z
      .array(
        z
          .object({
            id: z.enum(["backend", "frontend", "node", "mosquitto", "influxdb", "winsw"]),
            version: z.string().min(1),
            relativePath: z.string().min(1),
            sha256: sha256Schema,
            redistributionEvidence: z.string().min(1),
          })
          .strict()
      )
      .length(6),
  })
  .strict();

export type WindowsInstallerManifest = z.infer<typeof windowsInstallerManifestSchema>;

export const WINDOWS_INSTALLER_ISSUES = {
  MANIFEST_INVALID: "MANIFEST_INVALID",
  ARTIFACT_SET_INVALID: "ARTIFACT_SET_INVALID",
  ARTIFACT_PATH_UNSAFE: "ARTIFACT_PATH_UNSAFE",
  ARTIFACT_MISSING: "ARTIFACT_MISSING",
  ARTIFACT_NOT_FILE: "ARTIFACT_NOT_FILE",
  ARTIFACT_CHECKSUM_MISMATCH: "ARTIFACT_CHECKSUM_MISMATCH",
  FORBIDDEN_PAYLOAD: "FORBIDDEN_PAYLOAD",
} as const;

export type WindowsInstallerIssue = {
  code: (typeof WINDOWS_INSTALLER_ISSUES)[keyof typeof WINDOWS_INSTALLER_ISSUES];
  artifactId?: string;
};

const expectedIds = ["backend", "frontend", "node", "mosquitto", "influxdb", "winsw"];
const forbiddenNames = [
  ".env",
  "identity.json",
  "license.json",
  "activation-receipt.json",
  ".private.pem",
];

export function validateWindowsInstallerPackage(
  manifestInput: unknown,
  stagingDirectory?: string
): { ready: boolean; manifest?: WindowsInstallerManifest; issues: WindowsInstallerIssue[] } {
  const parsed = windowsInstallerManifestSchema.safeParse(manifestInput);
  if (!parsed.success) {
    return { ready: false, issues: [{ code: WINDOWS_INSTALLER_ISSUES.MANIFEST_INVALID }] };
  }

  const manifest = parsed.data;
  const issues: WindowsInstallerIssue[] = [];
  const ids = manifest.artifacts.map((artifact) => artifact.id);
  const actualIds = new Set<string>(ids);
  if (actualIds.size !== expectedIds.length || expectedIds.some((id) => !actualIds.has(id))) {
    issues.push({ code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_SET_INVALID });
  }

  for (const artifact of manifest.artifacts) {
    if (!isSafeRelativePath(artifact.relativePath)) {
      issues.push({ code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_PATH_UNSAFE, artifactId: artifact.id });
      continue;
    }
    if (forbiddenNames.some((name) => artifact.relativePath.toLowerCase().includes(name))) {
      issues.push({ code: WINDOWS_INSTALLER_ISSUES.FORBIDDEN_PAYLOAD, artifactId: artifact.id });
      continue;
    }
    if (!stagingDirectory) continue;
    const artifactPath = join(stagingDirectory, artifact.relativePath);
    if (!existsSync(artifactPath)) {
      issues.push({ code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_MISSING, artifactId: artifact.id });
    } else if (!statSync(artifactPath).isFile()) {
      issues.push({ code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_NOT_FILE, artifactId: artifact.id });
    } else if (sha256(artifactPath) !== artifact.sha256) {
      issues.push({
        code: WINDOWS_INSTALLER_ISSUES.ARTIFACT_CHECKSUM_MISMATCH,
        artifactId: artifact.id,
      });
    }
  }
  return { ready: issues.length === 0, manifest, issues };
}

export function readAndValidateWindowsInstallerPackage(stagingDirectory: string) {
  const manifestPath = join(stagingDirectory, "package-manifest.json");
  try {
    return validateWindowsInstallerPackage(
      JSON.parse(readFileSync(manifestPath, "utf8")),
      stagingDirectory
    );
  } catch {
    return { ready: false, issues: [{ code: WINDOWS_INSTALLER_ISSUES.MANIFEST_INVALID }] };
  }
}

function isSafeRelativePath(value: string): boolean {
  if (/^(?:[a-zA-Z]:|[\\/])/.test(value)) return false;
  const segments = value.split(/[\\/]+/);
  return segments.every((segment) => segment !== "" && segment !== "." && segment !== "..");
}

function sha256(path: string): string {
  return createHash("sha256").update(readFileSync(path)).digest("hex");
}
