import { createHash, randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, rm, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { AppError } from "../../errors/app-error";
const execute = promisify(execFile);
export type UpdateJob = {
  jobId: string;
  state: "UPLOADING" | "PREPARED" | "QUEUED" | "APPLYING" | "SUCCEEDED" | "FAILED";
  createdAt: string;
  updatedAt: string;
  actor: string;
  version?: string;
  sha256?: string;
  sourceCommit?: string;
  publisher?: string;
  error?: string;
};
function settings() {
  const root = process.env.BIOEMS_PERSISTENT_ROOT;
  const app = process.env.BIOEMS_APPLICATION_ROOT;
  if (!root || !app || process.platform !== "win32")
    throw new AppError("Windows update service is unavailable", 503, "UPDATE_UNAVAILABLE");
  return { root: resolve(root, "update-jobs"), app: resolve(app) };
}
export function compareUpdateVersions(candidate: string, installed: string): number {
  const parse = (value: string) => {
    if (!/^\d+\.\d+\.\d+$/.test(value)) throw new Error("Invalid update version");
    return value.split(".").map(Number);
  };
  const a = parse(candidate),
    b = parse(installed);
  for (let i = 0; i < 3; i++) if (a[i] !== b[i]) return a[i]! > b[i]! ? 1 : -1;
  return 0;
}
async function save(root: string, job: UpdateJob) {
  job.updatedAt = new Date().toISOString();
  const path = resolve(root, `${job.jobId}.json`);
  await writeFile(`${path}.tmp`, JSON.stringify(job));
  await rename(`${path}.tmp`, path);
}
async function jobs(root: string) {
  await mkdir(root, { recursive: true });
  const result: UpdateJob[] = [];
  for (const file of await readdir(root))
    if (/^[a-f0-9-]{36}\.json$/.test(file))
      result.push(JSON.parse(await readFile(resolve(root, file), "utf8")) as UpdateJob);
  return result.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function cloudUpdateUrl(environment: NodeJS.ProcessEnv = process.env): string | null {
  if (environment.BIOEMS_UPDATE_CLOUD_ENABLED !== "true") return null;
  try {
    const url = new URL(environment.BIOEMS_UPDATE_CLOUD_URL ?? "");
    if (url.protocol !== "https:" || url.username || url.password || url.hash) return null;
    return url.toString();
  } catch {
    return null;
  }
}
export async function downloadCloudUpdate(actor: string) {
  const url = cloudUpdateUrl();
  if (!url)
    throw new AppError("Cloud updates are not enabled in Pilot", 503, "UPDATE_CLOUD_DISABLED");
  settings();
  const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(300000) });
  if (!response.ok || !response.body)
    throw new AppError("Cloud update download failed", 502, "UPDATE_DOWNLOAD_FAILED");
  return stageUpdate(
    Readable.fromWeb(response.body as unknown as import("node:stream/web").ReadableStream),
    actor
  );
}
export async function updateStatus() {
  const { root, app } = settings();
  const manifest = JSON.parse(
    await readFile(resolve(app, "manifest/package-manifest.json"), "utf8")
  ) as { version: string; sourceCommit: string };
  return {
    installedVersion: manifest.version,
    sourceCommit: manifest.sourceCommit,
    internetEnabled: cloudUpdateUrl() !== null,
    latestJob: (await jobs(root))[0] ?? null,
  };
}
export async function stageUpdate(stream: Readable, actor: string) {
  const { root, app } = settings();
  await mkdir(root, { recursive: true });
  const lock = resolve(root, "upload.lock");
  try {
    await mkdir(lock);
  } catch {
    throw new AppError("Another upload is in progress", 409, "UPDATE_BUSY");
  }
  const now = new Date().toISOString();
  const job: UpdateJob = {
    jobId: randomUUID(),
    state: "UPLOADING",
    createdAt: now,
    updatedAt: now,
    actor,
  };
  const path = resolve(root, `${job.jobId}.exe`);
  let created = false;
  try {
    if (
      (await jobs(root)).some((j) =>
        ["UPLOADING", "PREPARED", "QUEUED", "APPLYING"].includes(j.state)
      )
    )
      throw new AppError("An update is already pending", 409, "UPDATE_BUSY");
    await save(root, job);
    created = true;
    let bytes = 0;
    const hash = createHash("sha256");
    await pipeline(
      stream,
      new Transform({
        transform(chunk: Buffer, _encoding, cb) {
          bytes += chunk.length;
          if (bytes > 536870912) return cb(new Error("Update exceeds 512 MiB"));
          hash.update(chunk);
          cb(null, chunk);
        },
      }),
      createWriteStream(path, { flags: "wx" })
    );
    const { stdout } = await execute(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        resolve(app, "installer/Test-PlatformUpdatePackage.ps1"),
        "-PackagePath",
        path,
      ],
      { timeout: 120000, windowsHide: true }
    );
    const evidence = JSON.parse(stdout.trim()) as {
      version: string;
      sourceCommit: string;
      sha256: string;
      publisher: string;
    };
    if (evidence.sha256 !== hash.digest("hex")) throw new Error("Update hash mismatch");
    const installed = await updateStatus();
    if (compareUpdateVersions(evidence.version, installed.installedVersion) < 0)
      throw new Error("Downgrades are not supported");
    Object.assign(job, evidence, { state: "PREPARED" });
    await save(root, job);
    return job;
  } catch (error) {
    job.state = "FAILED";
    job.error = error instanceof Error ? error.message : "Upload failed";
    if (created) await save(root, job);
    await rm(path, { force: true });
    throw error;
  } finally {
    await rm(lock, { recursive: true, force: true });
  }
}
export async function applyUpdate(jobId: string) {
  const { root } = settings();
  if (!/^[a-f0-9-]{36}$/.test(jobId))
    throw new AppError("Invalid update identifier", 400, "UPDATE_INVALID");
  const job = JSON.parse(await readFile(resolve(root, `${jobId}.json`), "utf8")) as UpdateJob;
  if (job.state !== "PREPARED") throw new AppError("Update is not prepared", 409, "UPDATE_STATE");
  job.state = "QUEUED";
  await save(root, job);
  await writeFile(resolve(root, `${jobId}.request.json`), JSON.stringify({ jobId }), {
    flag: "wx",
  });
  return job;
}
export async function cancelUpdate(jobId: string) {
  const { root } = settings();
  if (!/^[a-f0-9-]{36}$/.test(jobId))
    throw new AppError("Invalid identifier", 400, "UPDATE_INVALID");
  const job = JSON.parse(await readFile(resolve(root, `${jobId}.json`), "utf8")) as UpdateJob;
  if (job.state !== "PREPARED")
    throw new AppError("Cannot cancel a running update", 409, "UPDATE_STATE");
  job.state = "FAILED";
  job.error = "Cancelled before installation";
  await save(root, job);
  await rm(resolve(root, `${jobId}.exe`), { force: true });
}
