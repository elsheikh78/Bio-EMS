import dotenv from "dotenv";

const environmentFile = process.env.BIOEMS_ENV_FILE;
if (!environmentFile) {
  console.error("BIO-EMS protected service environment is unavailable");
  process.exitCode = 1;
} else {
  const loaded = dotenv.config({ path: environmentFile, override: false });
  if (loaded.error) {
    console.error("BIO-EMS protected service environment could not be loaded");
    process.exitCode = 1;
  } else {
    void import("../server").catch(() => {
      console.error("BIO-EMS Backend service failed during startup");
      process.exitCode = 1;
    });
  }
}
