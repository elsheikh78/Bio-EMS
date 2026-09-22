import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { BackupRestorePanel } from "./BackupRestorePanel";

const schedule = {
  enabled: true,
  intervalHours: 168,
  retentionCount: 7,
  nextRunAt: null,
  lastStartedAt: null,
  lastCompletedAt: "2026-09-22T06:57:09.000Z",
  lastFailure: null,
};

describe("BackupRestorePanel restore recovery", () => {
  afterEach(() => {
    window.sessionStorage.clear();
  });

  it("resumes a restore after refresh and replaces queued state with terminal success", async () => {
    window.sessionStorage.setItem(
      "bioems:active-restore-job:/platform-backups",
      "restore-1",
    );
    const request = vi.fn((path: string) => {
      if (path === "/platform-backups/restore-jobs/restore-1") {
        return Promise.resolve({
          restoreJob: { jobId: "restore-1", state: "SUCCEEDED" },
        });
      }
      if (path === "/platform-backups/schedule")
        return Promise.resolve({ schedule });
      if (path === "/platform-backups") {
        return Promise.resolve({
          backups: [],
          latestRestoreJob: { jobId: "restore-1", state: "SUCCEEDED" },
        });
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    render(
      <LocalizationProvider language="en">
        <BackupRestorePanel basePath="/platform-backups" request={request} />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Restore completed successfully."),
      ).toBeInTheDocument();
    });
    expect(
      window.sessionStorage.getItem(
        "bioems:active-restore-job:/platform-backups",
      ),
    ).toBeNull();
    expect(
      screen.queryByText("Backup data could not be loaded."),
    ).not.toBeInTheDocument();
  });

  it("accepts the latest durable terminal result when browser storage has a stale job id", async () => {
    window.sessionStorage.setItem(
      "bioems:active-restore-job:/platform-backups",
      "stale-browser-job",
    );
    const request = vi.fn((path: string) => {
      if (path === "/platform-backups/restore-jobs/stale-browser-job") {
        return Promise.reject(new Error("Stale restore job"));
      }
      if (path === "/platform-backups/schedule")
        return Promise.resolve({ schedule });
      if (path === "/platform-backups") {
        return Promise.resolve({
          backups: [],
          latestRestoreJob: { jobId: "actual-latest-job", state: "SUCCEEDED" },
        });
      }
      return Promise.reject(new Error(`Unexpected path: ${path}`));
    });

    render(
      <LocalizationProvider language="en">
        <BackupRestorePanel basePath="/platform-backups" request={request} />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Restore completed successfully."),
      ).toBeInTheDocument();
    });
    expect(
      window.sessionStorage.getItem(
        "bioems:active-restore-job:/platform-backups",
      ),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });

  it("unlocks controls when the authoritative list has no restore job", async () => {
    window.sessionStorage.setItem(
      "bioems:active-restore-job:/platform-backups",
      "missing-after-restore",
    );
    const request = vi.fn((path: string) => {
      if (path === "/platform-backups/schedule")
        return Promise.resolve({ schedule });
      if (path === "/platform-backups") {
        return Promise.resolve({ backups: [], latestRestoreJob: null });
      }
      return Promise.reject(
        new Error("Restore job is outside the restored identity scope"),
      );
    });

    render(
      <LocalizationProvider language="en">
        <BackupRestorePanel basePath="/platform-backups" request={request} />
      </LocalizationProvider>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "No active restore job was found; backup controls were unlocked.",
        ),
      ).toBeInTheDocument();
    });
    expect(
      window.sessionStorage.getItem(
        "bioems:active-restore-job:/platform-backups",
      ),
    ).toBeNull();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeEnabled();
  });
});
