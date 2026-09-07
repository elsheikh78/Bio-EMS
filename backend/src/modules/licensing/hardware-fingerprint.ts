import { createHash } from "node:crypto";

export const HARDWARE_COMPONENTS = ["machine", "system", "board", "disk", "network"] as const;
export type HardwareComponent = (typeof HARDWARE_COMPONENTS)[number];
export type HardwareSignals = Partial<Record<HardwareComponent, string>>;

export interface HardwareFingerprint {
  schemaVersion: 1;
  componentHashes: Partial<Record<HardwareComponent, string>>;
  compositeHash: string;
}

const hash = (value: string) =>
  createHash("sha256").update(value.trim().toLowerCase()).digest("hex");

export function createHardwareFingerprint(signals: HardwareSignals): HardwareFingerprint {
  const componentHashes = Object.fromEntries(
    HARDWARE_COMPONENTS.filter((component) => signals[component]?.trim()).map((component) => [
      component,
      hash(signals[component]!),
    ])
  ) as HardwareFingerprint["componentHashes"];
  if (Object.keys(componentHashes).length < 3) {
    throw new Error("At least three stable hardware components are required");
  }
  const compositeHash = hash(
    HARDWARE_COMPONENTS.map(
      (component) => `${component}:${componentHashes[component] ?? "missing"}`
    ).join("|")
  );
  return { schemaVersion: 1, componentHashes, compositeHash };
}

const weights: Record<HardwareComponent, number> = {
  machine: 35,
  system: 25,
  board: 20,
  disk: 15,
  network: 5,
};

export function compareHardwareFingerprint(
  licensed: HardwareFingerprint,
  current: HardwareFingerprint,
  minimumScore = 70
): { matches: boolean; score: number; changed: HardwareComponent[] } {
  const available = HARDWARE_COMPONENTS.filter(
    (component) => licensed.componentHashes[component] && current.componentHashes[component]
  );
  const total = available.reduce((sum, component) => sum + weights[component], 0);
  const matched = available.reduce(
    (sum, component) =>
      sum +
      (licensed.componentHashes[component] === current.componentHashes[component]
        ? weights[component]
        : 0),
    0
  );
  const score = total === 0 ? 0 : Math.round((matched / total) * 100);
  return {
    matches: score >= minimumScore,
    score,
    changed: available.filter(
      (component) => licensed.componentHashes[component] !== current.componentHashes[component]
    ),
  };
}
