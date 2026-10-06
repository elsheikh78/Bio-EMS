import { ThemeProvider } from "@mui/material";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import type { ApiClient } from "../api/client";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import {
  PlatformAuthenticationContext,
  type PlatformAuthenticationValue,
} from "../platform-auth/context";
import { createAppTheme } from "../theme/theme";
import { SystemOwnerHardwareLabPage } from "./SystemOwnerHardwareLabPage";

const runId = "11111111-1111-4111-8111-111111111111";

const profile = {
  revision: "REV-A-2G-HQT-1",
  faultCodes: ["MISSING_SENSOR"],
  firmwareCatalog: [
    {
      target: "MAIN16_BENCH",
      name: "BIOEMS-MAIN16-BENCH",
      device: "ESP32-S3 N16R8",
      purpose: "Bench qualification",
      availability: "SOURCE_REQUIRED",
    },
  ],
  steps: [
    {
      key: "BENCH_SETUP",
      order: 0,
      title: "Bench setup and traceability",
      stage: "Stage 0",
      instructions: ["Label hardware"],
      fields: [
        {
          key: "labelsComplete",
          label: "Labels completed",
          type: "boolean",
          required: true,
          rule: { kind: "boolean", expected: true },
        },
      ],
    },
  ],
};

const run = {
  id: runId,
  runNumber: "HQT-2026-ABCDEF12",
  profileRevision: "REV-A-2G-HQT-1",
  prototypeType: "MAIN-16-2G + SIM-D4",
  status: "TESTING",
  mainHardwareUid: "MAIN-01",
  simD4Serial: "SIM-01",
  operatorPrincipalId: "owner",
  operatorUsername: "system-owner",
  mainFirmwareVersion: null,
  simFirmwareVersion: null,
  mainFirmwareSha256: null,
  simFirmwareSha256: null,
  notes: null,
  createdAt: "2026-10-06T06:00:00.000Z",
  updatedAt: "2026-10-06T06:00:00.000Z",
  completedAt: null,
  steps: [
    {
      key: "BENCH_SETUP",
      order: 0,
      status: "PENDING",
      evidence: {},
      evaluation: {},
      recordedBy: null,
      recordedAt: null,
    },
  ],
  firmware: [],
  counts: { measurements: 0, events: 0 },
};

function renderPage() {
  const request = vi.fn((path: string) => {
    if (path === "/platform-hardware-lab/profile") return Promise.resolve(profile);
    if (path === "/platform-hardware-lab/runs") {
      return Promise.resolve({
        runs: [
          {
            id: runId,
            runNumber: run.runNumber,
            profileRevision: run.profileRevision,
            prototypeType: run.prototypeType,
            status: run.status,
            mainHardwareUid: run.mainHardwareUid,
            simD4Serial: run.simD4Serial,
            operatorUsername: run.operatorUsername,
            createdAt: run.createdAt,
            updatedAt: run.updatedAt,
            completedAt: null,
            passedSteps: 0,
            failedSteps: 0,
            totalSteps: 1,
          },
        ],
      });
    }
    if (path === `/platform-hardware-lab/runs/${runId}`) {
      return Promise.resolve(run);
    }
    if (path === `/platform-hardware-lab/runs/${runId}/measurements`) {
      return Promise.resolve({ measurements: [] });
    }
    if (path === `/platform-hardware-lab/runs/${runId}/events`) {
      return Promise.resolve({ events: [] });
    }
    return Promise.reject(new Error(`Unexpected request: ${path}`));
  });

  const apiClient = { request } as unknown as ApiClient;
  const value: PlatformAuthenticationValue = {
    status: "authenticated",
    principal: {
      kind: "platform",
      type: "SYSTEM_OWNER",
      id: "owner",
      username: "system-owner",
    },
    loginPending: false,
    apiClient,
    login: vi.fn(),
    logout: vi.fn(),
  };

  render(
    <LocalizationProvider language="en">
      <ThemeProvider theme={createAppTheme("ltr")}>
        <PlatformAuthenticationContext.Provider value={value}>
          <MemoryRouter>
            <SystemOwnerHardwareLabPage />
          </MemoryRouter>
        </PlatformAuthenticationContext.Provider>
      </ThemeProvider>
    </LocalizationProvider>,
  );

  return request;
}

describe("SystemOwnerHardwareLabPage", () => {
  it("renders the governed qualification workspace without a manual PASS selector", async () => {
    renderPage();

    expect(
      await screen.findByRole("heading", { name: "Hardware Lab" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Test & Qualification")).toBeInTheDocument();
    expect(await screen.findByText("HQT-2026-ABCDEF12")).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Active Test" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Firmware Center" })).toBeInTheDocument();
    expect(screen.queryByLabelText(/manual pass/i)).not.toBeInTheDocument();
  });
});
