import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

interface ReleaseManifest {
  product: string;
  version: string;
  components: string[];
  requiredDocuments: string[];
  externalAcceptanceRequired: boolean;
}

export interface ReleaseReadinessResult {
  ready: boolean;
  issues: string[];
  version?: string;
}

export function validateReleasePackage(repositoryRoot: string): ReleaseReadinessResult {
  const issues: string[] = [];
  const readJson = <T>(relativePath: string): T | undefined => {
    try {
      return JSON.parse(readFileSync(join(repositoryRoot, relativePath), "utf8")) as T;
    } catch {
      issues.push(`${relativePath} must exist and contain valid JSON`);
      return undefined;
    }
  };

  let version: string | undefined;
  try {
    version = readFileSync(join(repositoryRoot, "VERSION"), "utf8").trim();
  } catch {
    issues.push("VERSION must exist");
  }

  if (version && !/^\d+\.\d+\.\d+$/.test(version)) {
    issues.push("VERSION must contain a SemVer core version");
  }

  const backendPackage = readJson<{ version: string; engines?: { node?: string } }>(
    "backend/package.json"
  );
  const manifest = readJson<ReleaseManifest>("release-manifest.json");

  if (backendPackage && version !== backendPackage.version) {
    issues.push("backend/package.json version must match VERSION");
  }
  if (manifest) {
    if (manifest.product !== "BIO-EMS") issues.push("release manifest product must be BIO-EMS");
    if (manifest.version !== version) issues.push("release manifest version must match VERSION");
    if (!manifest.externalAcceptanceRequired) {
      issues.push("release manifest must preserve the external acceptance gate");
    }
    for (const component of ["backend", "frontend"]) {
      if (!manifest.components.includes(component))
        issues.push(`release manifest must include ${component}`);
    }
    for (const document of manifest.requiredDocuments) {
      if (!existsSync(join(repositoryRoot, document)))
        issues.push(`required release document missing: ${document}`);
    }
  }

  return { ready: issues.length === 0, issues, version };
}
