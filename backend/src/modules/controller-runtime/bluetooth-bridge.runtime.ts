import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";

// Owned by the backend Windows service so its process tree stops for Repair/Upgrade.
export function startBluetoothBridgeRuntime(origin = "https://localhost"): () => void {
  const executable = resolve(__dirname, "../../../../bluetooth-bridge/BIOEMS-Bluetooth-Bridge.exe");
  if (process.platform !== "win32" || !existsSync(executable)) return () => undefined;
  let stopped = false;
  let child: ReturnType<typeof spawn> | undefined;
  let retry: ReturnType<typeof setTimeout> | undefined;
  const start = () => {
    if (stopped) return;
    child = spawn(executable, ["--origin", origin], {
      windowsHide: true,
      stdio: "inherit",
    });
    child.on("error", () => console.error("Bluetooth relay could not start"));
    child.once("close", () => {
      if (!stopped) {
        retry = setTimeout(start, 10000);
        retry.unref();
      }
    });
  };
  start();
  return () => {
    stopped = true;
    if (retry) clearTimeout(retry);
    child?.kill();
  };
}
