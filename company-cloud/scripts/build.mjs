import { cpSync, mkdirSync, renameSync, rmSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("../", import.meta.url));
const frontend = fileURLToPath(new URL("../../frontend/", import.meta.url));
const run = spawnSync(
  process.execPath,
  [
    `${frontend}/node_modules/vite/bin/vite.js`,
    "build",
    "--emptyOutDir",
    "--outDir",
    `${root}/dist`,
  ],
  {
    cwd: frontend,
    stdio: "inherit",
    env: {
      ...process.env,
      VITE_COMPANY_CLOUD: "true",
      VITE_API_BASE_URL: "https://company.invalid/api/v1",
    },
  },
);
if (run.status !== 0) process.exit(run.status || 1);
renameSync(`${root}/dist/index.html`, `${root}/dist/owner.html`);
mkdirSync(`${root}/dist`, { recursive: true });
cpSync(`${root}/public`, `${root}/dist`, { recursive: true });
// No credentials, local DB or Node services are uploaded in this bundle.
rmSync(`${root}/dist/.env`, { force: true });
