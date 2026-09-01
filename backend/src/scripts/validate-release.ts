import { resolve } from "node:path";
import { validateReleasePackage } from "../release/release-readiness";

const repositoryRoot = resolve(process.cwd(), "..");
const result = validateReleasePackage(repositoryRoot);

if (!result.ready) {
  console.error("BIO-EMS release package readiness: FAILED");
  for (const issue of result.issues) console.error(`- ${issue}`);
  process.exitCode = 1;
} else {
  console.log(`BIO-EMS release package readiness: PASS (${result.version})`);
}
