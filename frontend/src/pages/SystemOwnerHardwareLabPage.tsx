import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { HardwareLabStep } from "../hardware-lab/contracts";
import {
  useCreateHardwareLabRun,
  useFinalizeHardwareLabRun,
  useHardwareLabProfile,
  useHardwareLabRun,
  useHardwareLabRuns,
  useRecordHardwareLabEvent,
  useRecordHardwareLabFirmware,
  useRecordHardwareLabStepResult,
  useStartHardwareLabStep,
} from "../hardware-lab/queries";
import { useLocalization } from "../localization/useLocalization";

type MetricDraft = {
  key: string;
  value: string;
  unit: string;
  channel: string;
};

function StepPanel({ runId, step }: { runId: string; step: HardwareLabStep }) {
  const start = useStartHardwareLabStep();
  const record = useRecordHardwareLabStepResult();
  const [notes, setNotes] = useState("");
  const [metrics, setMetrics] = useState<MetricDraft[]>(() => {
    if (step.step_code === "SENSOR_CABLE") {
      return [
        { key: "success_rate_percent", value: "", unit: "%", channel: "" },
      ];
    }
    if (
      step.step_code === "ENDURANCE_24H" ||
      step.step_code === "SYSTEM_16_SENSOR_48H"
    ) {
      return [
        { key: "unexplained_reboots", value: "", unit: "count", channel: "" },
        { key: "unrecovered_faults", value: "", unit: "count", channel: "" },
      ];
    }
    return [];
  });

  const submit = (status: "PASS" | "FAIL") => {
    record.mutate({
      runId,
      stepCode: step.step_code,
      status,
      notes: notes || undefined,
      metrics: metrics
        .filter((metric) => metric.key.trim() && metric.value.trim())
        .map((metric) => {
          const numeric = Number(metric.value);
          return {
            key: metric.key.trim(),
            ...(Number.isFinite(numeric)
              ? { value_real: numeric }
              : { value_text: metric.value }),
            ...(metric.unit.trim() ? { unit: metric.unit.trim() } : {}),
            ...(metric.channel.trim()
              ? { channel: metric.channel.trim() }
              : {}),
          };
        }),
    });
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={2}>
          <Box
            sx={{
              alignItems: "flex-start",
              display: "flex",
              gap: 1,
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography component="h3" variant="h6">
                {step.sequence}. {step.title}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                {step.acceptance_rule}
              </Typography>
            </Box>
            <Chip
              label={step.status}
              color={
                step.status === "PASS"
                  ? "success"
                  : step.status === "FAIL"
                    ? "error"
                    : step.status === "RUNNING"
                      ? "warning"
                      : "default"
              }
            />
          </Box>

          {step.status === "PENDING" || step.status === "FAIL" ? (
            <Button
              disabled={start.isPending}
              onClick={() => start.mutate({ runId, stepCode: step.step_code })}
              variant="outlined"
            >
              Start step
            </Button>
          ) : null}

          {step.status === "RUNNING" ? (
            <Stack spacing={2}>
              <TextField
                label="Test notes / observations"
                multiline
                minRows={2}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
              {metrics.map((metric, index) => (
                <Box
                  key={`${index}-${metric.key}`}
                  sx={{
                    display: "grid",
                    gap: 1,
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "2fr 1fr 1fr 1fr auto",
                    },
                  }}
                >
                  <TextField
                    label="Metric key"
                    value={metric.key}
                    onChange={(event) =>
                      setMetrics((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, key: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Value"
                    value={metric.value}
                    onChange={(event) =>
                      setMetrics((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, value: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Unit"
                    value={metric.unit}
                    onChange={(event) =>
                      setMetrics((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, unit: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <TextField
                    label="Channel"
                    value={metric.channel}
                    onChange={(event) =>
                      setMetrics((current) =>
                        current.map((item, itemIndex) =>
                          itemIndex === index
                            ? { ...item, channel: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                  <Button
                    onClick={() =>
                      setMetrics((current) =>
                        current.filter((_, itemIndex) => itemIndex !== index),
                      )
                    }
                  >
                    Remove
                  </Button>
                </Box>
              ))}
              <Button
                onClick={() =>
                  setMetrics((current) => [
                    ...current,
                    { key: "", value: "", unit: "", channel: "" },
                  ])
                }
              >
                Add measurement
              </Button>
              {record.isError ? (
                <Alert severity="error">
                  Result was not accepted. Check mandatory metrics and the
                  qualification gate.
                </Alert>
              ) : null}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  color="success"
                  disabled={record.isPending}
                  onClick={() => submit("PASS")}
                  variant="contained"
                >
                  Evaluate as PASS
                </Button>
                <Button
                  color="error"
                  disabled={record.isPending}
                  onClick={() => submit("FAIL")}
                  variant="outlined"
                >
                  Record FAIL
                </Button>
              </Stack>
            </Stack>
          ) : null}

          {step.notes ? (
            <Alert severity={step.status === "FAIL" ? "error" : "info"}>
              {step.notes}
            </Alert>
          ) : null}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SystemOwnerHardwareLabPage() {
  const { language } = useLocalization();
  const profile = useHardwareLabProfile();
  const runs = useHardwareLabRuns();
  const createRun = useCreateHardwareLabRun();
  const [selectedRunId, setSelectedRunId] = useState<string>();
  const selected = useHardwareLabRun(selectedRunId);
  const finalize = useFinalizeHardwareLabRun();
  const firmware = useRecordHardwareLabFirmware();
  const event = useRecordHardwareLabEvent();

  const [mainUid, setMainUid] = useState("");
  const [simSerial, setSimSerial] = useState("");
  const [runNotes, setRunNotes] = useState("");

  const [fwTarget, setFwTarget] = useState<
    "MAIN16" | "SIMD4" | "SITE_CONTROLLER"
  >("MAIN16");
  const [fwName, setFwName] = useState("BIOEMS-MAIN16-BENCH");
  const [fwVersion, setFwVersion] = useState("");
  const [fwChip, setFwChip] = useState("ESP32-S3");
  const [fwPort, setFwPort] = useState("");
  const [fwSha, setFwSha] = useState("");
  const [fwOutput, setFwOutput] = useState("");

  const [faultStep, setFaultStep] = useState("");
  const [faultCode, setFaultCode] = useState("MISSING_SENSOR");
  const [faultExpected, setFaultExpected] = useState("");
  const [faultObserved, setFaultObserved] = useState("");
  const [faultSeverity, setFaultSeverity] = useState<
    "INFO" | "WARNING" | "ERROR"
  >("INFO");

  const runRows = runs.data?.runs ?? [];
  const run = selected.data?.run;
  const passCount = useMemo(
    () =>
      selected.data?.steps.filter((step) => step.status === "PASS").length ?? 0,
    [selected.data?.steps],
  );

  const text =
    language === "ar"
      ? {
          back: "العودة إلى لوحة مالك النظام",
          title: "Hardware Lab — الاختبار والتأهيل",
          intro:
            "واجهة المصنع لتأهيل MAIN-16-2G و SIM-D4: خطوات الاختبار، القياسات، Firmware evidence، Fault Injection، التحمل والتقرير النهائي.",
          create: "إنشاء Test Run جديد",
          active: "الاختبار الحالي",
          history: "سجل الاختبارات",
          firmware: "Firmware Center / Evidence",
          faults: "Fault Injection & Events",
          report: "Qualification Summary",
        }
      : {
          back: "Back to owner console",
          title: "Hardware Lab — Test & Qualification",
          intro:
            "Manufacturer qualification workspace for MAIN-16-2G and SIM-D4: ordered tests, measurements, firmware evidence, fault injection, endurance and final report.",
          create: "Create new Test Run",
          active: "Active qualification",
          history: "Test history",
          firmware: "Firmware Center / Evidence",
          faults: "Fault Injection & Events",
          report: "Qualification Summary",
        };

  return (
    <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner">
        {text.back}
      </Button>
      <Typography component="h1" variant="h4" sx={{ my: 2 }}>
        {text.title}
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        {text.intro}
      </Alert>

      {profile.isPending ? <CircularProgress /> : null}
      {profile.data ? (
        <Alert severity="success" sx={{ mb: 3 }}>
          Hardware profile {profile.data.hardware_profile_rev} · Test profile{" "}
          {profile.data.test_profile_rev} · Sensor cable gate ≥{" "}
          {profile.data.sensor_success_rate_percent}%
        </Alert>
      ) : null}

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            {text.create}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr 2fr auto" },
            }}
          >
            <TextField
              label="MAIN hardware UID / label"
              value={mainUid}
              onChange={(e) => setMainUid(e.target.value)}
            />
            <TextField
              label="SIM-D4 serial / label"
              value={simSerial}
              onChange={(e) => setSimSerial(e.target.value)}
            />
            <TextField
              label="Run notes"
              value={runNotes}
              onChange={(e) => setRunNotes(e.target.value)}
            />
            <Button
              disabled={createRun.isPending}
              onClick={() =>
                createRun.mutate(
                  {
                    ...(mainUid.trim()
                      ? { main_hardware_uid: mainUid.trim() }
                      : {}),
                    ...(simSerial.trim()
                      ? { sim_serial: simSerial.trim() }
                      : {}),
                    ...(runNotes.trim() ? { notes: runNotes.trim() } : {}),
                  },
                  {
                    onSuccess: (created) => setSelectedRunId(created.run.id),
                  },
                )
              }
              variant="contained"
            >
              Create
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            {text.history}
          </Typography>
          {runs.isPending ? <CircularProgress size={24} /> : null}
          <TextField
            fullWidth
            label="Test Run"
            select
            value={selectedRunId ?? ""}
            onChange={(e) => setSelectedRunId(e.target.value || undefined)}
          >
            {runRows.map((item) => (
              <MenuItem key={item.id} value={item.id}>
                {item.run_code} — {item.status} —{" "}
                {item.main_hardware_uid ?? "MAIN not set"} — {item.created_at}
              </MenuItem>
            ))}
          </TextField>
        </CardContent>
      </Card>

      {selected.isPending ? <CircularProgress /> : null}
      {run && selected.data ? (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack spacing={1}>
                <Typography component="h2" variant="h6">
                  {text.active}: {run.run_code}
                </Typography>
                <Typography>
                  Status: <Chip label={run.status} size="small" /> · Progress:{" "}
                  {passCount}/{selected.data.steps.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Operator: {run.operator} · MAIN:{" "}
                  {run.main_hardware_uid ?? "—"} · SIM-D4:{" "}
                  {run.sim_serial ?? "—"}
                </Typography>
              </Stack>
            </CardContent>
          </Card>

          <Stack spacing={2} sx={{ mb: 3 }}>
            {selected.data.steps.map((step) => (
              <StepPanel key={step.step_code} runId={run.id} step={step} />
            ))}
          </Stack>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                {text.firmware}
              </Typography>
              {profile.data ? (
                <Stack spacing={1} sx={{ mb: 2 }}>
                  {profile.data.firmware.map((item) => (
                    <Alert
                      key={item.target}
                      severity={
                        item.requiredForPhysicalQualification
                          ? "warning"
                          : "info"
                      }
                    >
                      {item.target}: {item.name} — {item.chip} — {item.purpose}
                    </Alert>
                  ))}
                </Stack>
              ) : null}
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                }}
              >
                <TextField
                  label="Target"
                  select
                  value={fwTarget}
                  onChange={(e) => {
                    const target = e.target.value as typeof fwTarget;
                    setFwTarget(target);
                    if (target === "MAIN16") {
                      setFwName("BIOEMS-MAIN16-BENCH");
                      setFwChip("ESP32-S3");
                    } else if (target === "SIMD4") {
                      setFwName("BIOEMS-SIMD4-BENCH");
                      setFwChip("ATmega328P / Arduino Nano");
                    } else {
                      setFwName("BIOEMS-SITE-CONTROLLER-PILOT");
                      setFwChip("ESP32-S3");
                    }
                  }}
                >
                  <MenuItem value="MAIN16">MAIN16 — ESP32-S3</MenuItem>
                  <MenuItem value="SIMD4">SIMD4 — ATmega328P/Nano</MenuItem>
                  <MenuItem value="SITE_CONTROLLER">
                    Site Controller — ESP32-S3
                  </MenuItem>
                </TextField>
                <TextField
                  label="Firmware name"
                  value={fwName}
                  onChange={(e) => setFwName(e.target.value)}
                />
                <TextField
                  label="Version"
                  value={fwVersion}
                  onChange={(e) => setFwVersion(e.target.value)}
                />
                <TextField
                  label="Chip"
                  value={fwChip}
                  onChange={(e) => setFwChip(e.target.value)}
                />
                <TextField
                  label="COM port"
                  value={fwPort}
                  onChange={(e) => setFwPort(e.target.value)}
                />
                <TextField
                  label="SHA-256 (optional)"
                  value={fwSha}
                  onChange={(e) => setFwSha(e.target.value)}
                  error={Boolean(fwSha) && !/^[A-Fa-f0-9]{64}$/.test(fwSha)}
                />
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={2}
                label="Flash / verification tool output"
                sx={{ mt: 2 }}
                value={fwOutput}
                onChange={(e) => setFwOutput(e.target.value)}
              />
              <Button
                sx={{ mt: 2 }}
                variant="contained"
                disabled={
                  !fwVersion.trim() ||
                  firmware.isPending ||
                  (Boolean(fwSha) && !/^[A-Fa-f0-9]{64}$/.test(fwSha))
                }
                onClick={() =>
                  firmware.mutate({
                    runId: run.id,
                    target: fwTarget,
                    firmware_name: fwName.trim(),
                    version: fwVersion.trim(),
                    chip: fwChip.trim(),
                    ...(fwPort.trim() ? { port: fwPort.trim() } : {}),
                    ...(fwSha.trim() ? { sha256: fwSha.trim() } : {}),
                    ...(fwOutput.trim()
                      ? { tool_output: fwOutput.trim() }
                      : {}),
                    flash_status: "PASS",
                  })
                }
              >
                Record verified flash
              </Button>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {selected.data.firmware.map((item) => (
                  <Alert
                    key={item.id}
                    severity={
                      item.flash_status === "PASS"
                        ? "success"
                        : item.flash_status === "FAIL"
                          ? "error"
                          : "info"
                    }
                  >
                    {item.target} · {item.firmware_name} {item.version} ·{" "}
                    {item.chip} · {item.port ?? "no COM"} · {item.flash_status}
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                {text.faults}
              </Typography>
              <Box
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                }}
              >
                <TextField
                  label="Step"
                  select
                  value={faultStep}
                  onChange={(e) => setFaultStep(e.target.value)}
                >
                  <MenuItem value="">Run-level event</MenuItem>
                  {selected.data.steps.map((step) => (
                    <MenuItem key={step.step_code} value={step.step_code}>
                      {step.sequence}. {step.title}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Fault / event code"
                  select
                  value={faultCode}
                  onChange={(e) => setFaultCode(e.target.value)}
                >
                  {(profile.data?.fault_codes ?? []).map((code) => (
                    <MenuItem key={code} value={code}>
                      {code}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  label="Expected"
                  value={faultExpected}
                  onChange={(e) => setFaultExpected(e.target.value)}
                />
                <TextField
                  label="Observed"
                  value={faultObserved}
                  onChange={(e) => setFaultObserved(e.target.value)}
                />
                <TextField
                  label="Severity"
                  select
                  value={faultSeverity}
                  onChange={(e) =>
                    setFaultSeverity(e.target.value as typeof faultSeverity)
                  }
                >
                  <MenuItem value="INFO">INFO</MenuItem>
                  <MenuItem value="WARNING">WARNING</MenuItem>
                  <MenuItem value="ERROR">ERROR</MenuItem>
                </TextField>
              </Box>
              <Button
                sx={{ mt: 2 }}
                variant="outlined"
                disabled={!faultCode || event.isPending}
                onClick={() =>
                  event.mutate({
                    runId: run.id,
                    ...(faultStep ? { step_code: faultStep } : {}),
                    event_code: faultCode,
                    ...(faultExpected ? { expected: faultExpected } : {}),
                    ...(faultObserved ? { observed: faultObserved } : {}),
                    severity: faultSeverity,
                  })
                }
              >
                Record event
              </Button>
              <Stack spacing={1} sx={{ mt: 2 }}>
                {selected.data.events.map((item) => (
                  <Alert
                    key={item.id}
                    severity={
                      item.severity === "ERROR"
                        ? "error"
                        : item.severity === "WARNING"
                          ? "warning"
                          : "info"
                    }
                  >
                    {item.event_code} · {item.step_code ?? "RUN"} · expected:{" "}
                    {item.expected ?? "—"} · observed: {item.observed ?? "—"}
                  </Alert>
                ))}
              </Stack>
            </CardContent>
          </Card>

          <Card variant="outlined">
            <CardContent>
              <Typography component="h2" variant="h6">
                {text.report}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography>Run: {run.run_code}</Typography>
              <Typography>Qualification status: {run.status}</Typography>
              <Typography>
                Steps passed: {passCount}/{selected.data.steps.length}
              </Typography>
              <Typography>
                Firmware evidence records: {selected.data.firmware.length}
              </Typography>
              <Typography>
                Stored measurements: {selected.data.measurements.length}
              </Typography>
              <Typography>
                Fault/event records: {selected.data.events.length}
              </Typography>
              {finalize.data?.run.status === "FAIL" ? (
                <Alert severity="error" sx={{ mt: 2 }}>
                  Final gate failed. Every qualification step plus verified
                  MAIN16 and SIMD4 bench firmware evidence must PASS.
                </Alert>
              ) : null}
              {finalize.data?.run.status === "PASS" ? (
                <Alert severity="success" sx={{ mt: 2 }}>
                  QUALIFIED — all software qualification gates are satisfied.
                </Alert>
              ) : null}
              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                sx={{ mt: 2 }}
              >
                <Button
                  variant="contained"
                  disabled={finalize.isPending}
                  onClick={() => finalize.mutate({ runId: run.id })}
                >
                  Final qualification decision
                </Button>
                <Button variant="outlined" onClick={() => window.print()}>
                  Print / Save report
                </Button>
                <Button
                  component={Link}
                  to="/system-owner/device-provisioning"
                  variant="outlined"
                >
                  Proceed to Device Provisioning
                </Button>
              </Stack>
            </CardContent>
          </Card>
        </>
      ) : null}
    </Container>
  );
}
