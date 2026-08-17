import { validateDeploymentEnvironment } from "../config/deployment-readiness";

const result = validateDeploymentEnvironment(process.env);

if (!result.ready) {
  console.error("BIO-EMS deployment readiness: FAILED");
  for (const issue of result.issues) {
    console.error(`- ${issue}`);
  }
  process.exitCode = 1;
} else {
  console.log("BIO-EMS deployment readiness: PASS");
}
