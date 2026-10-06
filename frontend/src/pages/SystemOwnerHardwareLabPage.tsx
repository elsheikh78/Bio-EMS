import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
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
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  hardwareEventListSchema,
  hardwareMeasurementListSchema,
  hardwareProfileSchema,
  hardwareReportSchema,
  hardwareRunListSchema,
  hardwareRunSchema,
  type HardwareEventRecord,
  type HardwareEvidenceValue,
  type HardwareMeasurementRecord,
  type HardwareProfile,
  type HardwareRun,
  type HardwareRunListItem,
  type HardwareStepDefinition,
} from "../hardware-lab/contracts";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";

const copy = {
  en: {
    back: "Back to owner console",
    title: "Hardware Lab",
    subtitle: "Test & Qualification",
    intro:
      "Manufacturer-only qualification workspace for MAIN-16-2G + SIM-D4. Test evidence is stored on the BIO-EMS backend and PASS/FAIL is calculated from the approved profile.",
    tabs: ["Active Test", "Firmware Center", "Test History", "Qualification Report"],
    newRun: "New Test Run",
    create: "Create run",
    creating: "Creating…",
    prototype: "Prototype type",
    mainUid: "MAIN hardware UID / label",
    simSerial: "SIM-D4 serial / label",
    notes: "Notes",
    selectRun: "Qualification run",
    noRuns: "No qualification runs have been created yet.",
    loading: "Loading Hardware Lab…",
    loadError: "Hardware Lab data could not be loaded.",
    status: "Status",
    operator: "Operator",
    profile: "Profile",
    created: "Created",
    progress: "Progress",
    measurements: "Measurements",
    events: "Fault events",
    saveStep: "Evaluate & Save Step",
    saving: "Evaluating…",
    required: "Required",
    yes: "Yes",
    no: "No",
    instructions: "Required actions",
    acceptance: "Acceptance note",
    evaluation: "Evaluation",
    measurementRecorder: "Measurement recorder",
    step: "Test step",
    channel: "Channel",
    metric: "Metric key",
    numericValue: "Numeric value",
    textValue: "Text value",
    unit: "Unit",
    addMeasurement: "Store measurement",
    eventRecorder: "Fault event recorder",
    faultCode: "Fault code",
    severity: "Severity",
    addEvent: "Store event",
    evidenceSaved: "Evidence stored.",
    storedEvidence: "Recent stored evidence",
    noEvidence: "No stored records yet.",
    firmwareIntro:
      "Firmware is installed only on programmable IC/MCU targets. Passive modules and peripherals do not receive firmware.",
    provisioner: "Local COM / flashing service",
    refreshPorts: "Refresh COM ports",
    comPort: "COM port",
    detectEsp: "Detect ESP32-S3",
    detectResult: "Detection result",
    firmwareRecord: "Firmware evidence",
    firmwareTarget: "Firmware target",
    firmwareName: "Firmware name",
    firmwareVersion: "Firmware version",
    sha256: "SHA-256",
    sourceCommit: "Source commit",
    flashResult: "Flash result",
    storeFirmware: "Store firmware evidence",
    sourceRequired:
      "Bench firmware source/package is not yet present in the repository. Do not claim this target as flashed until an actual package and hash are available.",
    deviceProvisioning:
      "The final pilot firmware is handled by Device Provisioning after the hardware run is QUALIFIED.",
    passive:
      "No firmware: DS18B20, HW-519/MAX485, W5500, SIM800L, DS3231, MicroSD, CD4052 and power converters.",
    history: "Qualification history",
    finalDecision: "Final decision",
    pending: "Pending",
    passed: "Passed",
    failed: "Failed",
    report: "Qualification report",
    refreshReport: "Refresh report",
    qualified: "QUALIFIED",
    notQualified: "NOT QUALIFIED",
    proceed: "Proceed to Device Provisioning",
    blocked:
      "Device Provisioning remains blocked until all qualification stages, including calibration/accuracy, are PASS.",
    physical:
      "24 h / 48 h and cable qualification are physical tests. BIO-EMS stores and evaluates their evidence but software CI cannot substitute for real hardware execution.",
  },
  ar: {
    back: "العودة إلى لوحة مالك النظام",
    title: "مختبر الهاردوير",
    subtitle: "الاختبار والتأهيل",
    intro:
      "واجهة خاصة بالمصنّع لتأهيل MAIN-16-2G + SIM-D4. يتم حفظ أدلة الاختبار في Backend ويحسب النظام PASS/FAIL طبقاً لبروفايل الاختبار المعتمد.",
    tabs: ["الاختبار الحالي", "مركز Firmware", "سجل الاختبارات", "تقرير التأهيل"],
    newRun: "اختبار جديد",
    create: "إنشاء الاختبار",
    creating: "جارٍ الإنشاء…",
    prototype: "نوع النموذج",
    mainUid: "رقم / ملصق MAIN",
    simSerial: "رقم / ملصق SIM-D4",
    notes: "ملاحظات",
    selectRun: "رقم اختبار التأهيل",
    noRuns: "لا توجد اختبارات تأهيل محفوظة حتى الآن.",
    loading: "جارٍ تحميل مختبر الهاردوير…",
    loadError: "تعذر تحميل بيانات مختبر الهاردوير.",
    status: "الحالة",
    operator: "المنفذ",
    profile: "بروفايل الاختبار",
    created: "تاريخ الإنشاء",
    progress: "التقدم",
    measurements: "القراءات المحفوظة",
    events: "أحداث الأعطال",
    saveStep: "تقييم وحفظ الخطوة",
    saving: "جارٍ التقييم…",
    required: "إلزامي",
    yes: "نعم",
    no: "لا",
    instructions: "الخطوات المطلوبة",
    acceptance: "ملاحظة القبول",
    evaluation: "نتيجة التقييم",
    measurementRecorder: "تسجيل قراءة اختبار",
    step: "خطوة الاختبار",
    channel: "القناة",
    metric: "اسم القياس",
    numericValue: "قيمة رقمية",
    textValue: "قيمة نصية",
    unit: "الوحدة",
    addMeasurement: "حفظ القراءة",
    eventRecorder: "تسجيل حدث عطل",
    faultCode: "كود العطل",
    severity: "الدرجة",
    addEvent: "حفظ الحدث",
    evidenceSaved: "تم حفظ الدليل.",
    storedEvidence: "أحدث الأدلة المحفوظة",
    noEvidence: "لا توجد سجلات محفوظة حتى الآن.",
    firmwareIntro:
      "يتم تحميل Firmware فقط على الـIC/MCU القابل للبرمجة. الوحدات السلبية والـperipherals لا يتم تحميل Firmware عليها.",
    provisioner: "خدمة COM والتفليش المحلية",
    refreshPorts: "تحديث منافذ COM",
    comPort: "منفذ COM",
    detectEsp: "اكتشاف ESP32-S3",
    detectResult: "نتيجة الاكتشاف",
    firmwareRecord: "توثيق Firmware",
    firmwareTarget: "هدف Firmware",
    firmwareName: "اسم Firmware",
    firmwareVersion: "إصدار Firmware",
    sha256: "SHA-256",
    sourceCommit: "Source commit",
    flashResult: "نتيجة التفليش",
    storeFirmware: "حفظ بيانات Firmware",
    sourceRequired:
      "حزمة Bench Firmware غير موجودة حالياً في الريبو. لا يتم تسجيل هذا الهدف على أنه تم تفليشه قبل وجود Package حقيقي وHash.",
    deviceProvisioning:
      "Firmware البيلوت النهائي يتم من Device Provisioning بعد حصول اختبار الهاردوير على QUALIFIED.",
    passive:
      "لا يوجد Firmware على: DS18B20 وHW-519/MAX485 وW5500 وSIM800L وDS3231 وMicroSD وCD4052 ومحولات القدرة.",
    history: "سجل اختبارات التأهيل",
    finalDecision: "القرار النهائي",
    pending: "معلق",
    passed: "ناجح",
    failed: "فاشل",
    report: "تقرير التأهيل",
    refreshReport: "تحديث التقرير",
    qualified: "QUALIFIED",
    notQualified: "NOT QUALIFIED",
    proceed: "الانتقال إلى Device Provisioning",
    blocked:
      "يظل Device Provisioning محجوباً حتى تنجح جميع مراحل التأهيل بما فيها المعايرة والدقة.",
    physical:
      "اختبارات 24 و48 ساعة والكابلات اختبارات فعلية على الهاردوير. المنصة تحفظ أدلتها وتقيمها، لكن نجاح CI لا يعتبر بديلاً عن تنفيذها على الجهاز الحقيقي.",
  },
} as const;

type StepDrafts = Record<string, Record<string, HardwareEvidenceValue>>;

function chipColor(status: string): "default" | "success" | "error" | "warning" {
  if (status === "PASS" || status === "QUALIFIED") return "success";
  if (status === "FAIL" || status === "FAILED") return "error";
  if (status === "TESTING") return "warning";
  return "default";
}

function evaluationReasons(value: unknown): string[] {
  if (!value || typeof value !== "object") return [];
  const reasons = (value as { reasons?: unknown }).reasons;
  return Array.isArray(reasons)
    ? reasons.filter((reason): reason is string => typeof reason === "string")
    : [];
}

export function SystemOwnerHardwareLabPage() {
  const { language } = useLocalization();
  const { apiClient } = usePlatformAuthentication();
  const text = copy[language];
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<HardwareProfile>();
  const [runs, setRuns] = useState<HardwareRunListItem[]>([]);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [run, setRun] = useState<HardwareRun>();
  const [drafts, setDrafts] = useState<StepDrafts>({});
  const [report, setReport] =
    useState<ReturnType<typeof hardwareReportSchema.parse>>();
  const [storedMeasurements, setStoredMeasurements] = useState<
    HardwareMeasurementRecord[]
  >([]);
  const [storedEvents, setStoredEvents] = useState<HardwareEventRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [pendingStep, setPendingStep] = useState("");
  const [notice, setNotice] = useState("");

  const [prototypeType, setPrototypeType] = useState("MAIN-16-2G + SIM-D4");
  const [mainHardwareUid, setMainHardwareUid] = useState("");
  const [simD4Serial, setSimD4Serial] = useState("");
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const [measurementStep, setMeasurementStep] = useState("");
  const [measurementChannel, setMeasurementChannel] = useState("");
  const [measurementMetric, setMeasurementMetric] = useState("");
  const [measurementNumeric, setMeasurementNumeric] = useState("");
  const [measurementText, setMeasurementText] = useState("");
  const [measurementUnit, setMeasurementUnit] = useState("");

  const [eventStep, setEventStep] = useState("");
  const [eventCode, setEventCode] = useState("");
  const [eventSeverity, setEventSeverity] = useState("INFO");

  const [ports, setPorts] = useState<Array<{ port: string; name: string | null }>>([]);
  const [selectedPort, setSelectedPort] = useState("");
  const [provisionerStatus, setProvisionerStatus] = useState("");
  const [detectResult, setDetectResult] = useState("");

  const [firmwareTarget, setFirmwareTarget] = useState("MAIN16_BENCH");
  const [firmwareName, setFirmwareName] = useState("BIOEMS-MAIN16-BENCH");
  const [firmwareVersion, setFirmwareVersion] = useState("");
  const [firmwareSha, setFirmwareSha] = useState("");
  const [firmwareCommit, setFirmwareCommit] = useState("");
  const [flashResult, setFlashResult] = useState("RECORDED");

  const protectedRequest = useCallback(
    <T,>(path: `/${string}`, options: RequestInit = {}) =>
      apiClient.request<T>(path, { ...options, auth: "protected" }),
    [apiClient],
  );

  const loadRun = useCallback(
    async (runId: string) => {
      const raw = await protectedRequest<unknown>(
        `/platform-hardware-lab/runs/${runId}`,
      );
      const parsed = hardwareRunSchema.parse(raw);
      const [measurementRaw, eventRaw] = await Promise.all([
        protectedRequest<unknown>(
          `/platform-hardware-lab/runs/${runId}/measurements`,
        ),
        protectedRequest<unknown>(
          `/platform-hardware-lab/runs/${runId}/events`,
        ),
      ]);
      setStoredMeasurements(
        hardwareMeasurementListSchema.parse(measurementRaw).measurements,
      );
      setStoredEvents(hardwareEventListSchema.parse(eventRaw).events);
      setRun(parsed);
      setDrafts(
        Object.fromEntries(
          parsed.steps.map((step) => [step.key, { ...step.evidence }]),
        ),
      );
      setMeasurementStep((current) => current || parsed.steps[0]?.key || "");
      setEventStep((current) => current || parsed.steps[0]?.key || "");
      return parsed;
    },
    [protectedRequest],
  );

  const loadRuns = useCallback(async () => {
    const raw = await protectedRequest<unknown>("/platform-hardware-lab/runs");
    const parsed = hardwareRunListSchema.parse(raw);
    setRuns(parsed.runs);
    setSelectedRunId((current) => current || parsed.runs[0]?.id || "");
    return parsed.runs;
  }, [protectedRequest]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setLoadError(false);
    Promise.all([
      protectedRequest<unknown>("/platform-hardware-lab/profile"),
      protectedRequest<unknown>("/platform-hardware-lab/runs"),
    ])
      .then(([profileRaw, runsRaw]) => {
        if (!active) return;
        const parsedProfile = hardwareProfileSchema.parse(profileRaw);
        const parsedRuns = hardwareRunListSchema.parse(runsRaw).runs;
        setProfile(parsedProfile);
        setRuns(parsedRuns);
        setSelectedRunId((current) => current || parsedRuns[0]?.id || "");
        setEventCode(parsedProfile.faultCodes[0] ?? "");
      })
      .catch(() => {
        if (active) setLoadError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [protectedRequest]);

  useEffect(() => {
    if (!selectedRunId) {
      setRun(undefined);
      return;
    }
    void loadRun(selectedRunId).catch(() => setLoadError(true));
  }, [loadRun, selectedRunId]);

  const stepByKey = useMemo(
    () => new Map(profile?.steps.map((step) => [step.key, step]) ?? []),
    [profile],
  );

  const createRun = async () => {
    setCreating(true);
    setNotice("");
    try {
      const raw = await protectedRequest<unknown>("/platform-hardware-lab/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prototypeType,
          ...(mainHardwareUid ? { mainHardwareUid } : {}),
          ...(simD4Serial ? { simD4Serial } : {}),
          ...(notes ? { notes } : {}),
        }),
      });
      const created = hardwareRunSchema.parse(raw);
      await loadRuns();
      setSelectedRunId(created.id);
      setRun(created);
      setMainHardwareUid("");
      setSimD4Serial("");
      setNotes("");
    } finally {
      setCreating(false);
    }
  };

  const updateDraft = (
    stepKey: string,
    fieldKey: string,
    value: HardwareEvidenceValue,
  ) => {
    setDrafts((current) => ({
      ...current,
      [stepKey]: {
        ...(current[stepKey] ?? {}),
        [fieldKey]: value,
      },
    }));
  };

  const submitStep = async (step: HardwareStepDefinition) => {
    if (!run) return;
    setPendingStep(step.key);
    setNotice("");
    try {
      const raw = await protectedRequest<unknown>(
        `/platform-hardware-lab/runs/${run.id}/steps/${step.key}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ values: drafts[step.key] ?? {} }),
        },
      );
      const updated = hardwareRunSchema.parse(raw);
      setRun(updated);
      setNotice(text.evidenceSaved);
      await loadRuns();
    } finally {
      setPendingStep("");
    }
  };

  const addMeasurement = async () => {
    if (!run || !measurementStep || !measurementMetric) return;
    await protectedRequest(
      `/platform-hardware-lab/runs/${run.id}/measurements`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stepKey: measurementStep,
          ...(measurementChannel ? { channel: measurementChannel } : {}),
          metricKey: measurementMetric,
          ...(measurementNumeric !== ""
            ? { numericValue: Number(measurementNumeric) }
            : {}),
          ...(measurementText ? { textValue: measurementText } : {}),
          ...(measurementUnit ? { unit: measurementUnit } : {}),
        }),
      },
    );
    await loadRun(run.id);
    setMeasurementNumeric("");
    setMeasurementText("");
    setNotice(text.evidenceSaved);
  };

  const addEvent = async () => {
    if (!run || !eventStep || !eventCode) return;
    await protectedRequest(`/platform-hardware-lab/runs/${run.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stepKey: eventStep,
        code: eventCode,
        severity: eventSeverity,
        payload: {},
      }),
    });
    await loadRun(run.id);
    setNotice(text.evidenceSaved);
  };

  const loadProvisioner = async () => {
    const [healthRaw, portsRaw] = await Promise.all([
      protectedRequest<unknown>("/platform-operations/device-provisioning/health"),
      protectedRequest<unknown>("/platform-operations/device-provisioning/ports"),
    ]);
    const health =
      healthRaw && typeof healthRaw === "object"
        ? (healthRaw as Record<string, unknown>)
        : {};
    const inventory =
      portsRaw && typeof portsRaw === "object"
        ? (portsRaw as { ports?: Array<{ port: string; name: string | null }> }).ports
        : undefined;
    setProvisionerStatus(
      `${String(health.status ?? "UNKNOWN")} · esptool=${String(
        health.esptoolReady ?? false,
      )} · firmware=${String(health.firmwareReady ?? false)}`,
    );
    setPorts(inventory ?? []);
    setSelectedPort((current) => current || inventory?.[0]?.port || "");
  };

  const detectEsp = async () => {
    if (!selectedPort) return;
    const raw = await protectedRequest<unknown>(
      "/platform-operations/device-provisioning/detect",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ port: selectedPort }),
      },
    );
    setDetectResult(JSON.stringify(raw, null, 2));
  };

  const recordFirmware = async () => {
    if (!run || !firmwareVersion) return;
    const raw = await protectedRequest<unknown>(
      `/platform-hardware-lab/runs/${run.id}/firmware/${firmwareTarget}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firmwareName,
          firmwareVersion,
          ...(firmwareSha ? { sha256: firmwareSha } : {}),
          ...(firmwareCommit ? { sourceCommit: firmwareCommit } : {}),
          ...(selectedPort ? { port: selectedPort } : {}),
          flashResult,
          evidence: detectResult ? { detection: detectResult } : {},
        }),
      },
    );
    setRun(hardwareRunSchema.parse(raw));
    await loadRuns();
    setNotice(text.evidenceSaved);
  };

  const loadReport = async () => {
    if (!run) return;
    const raw = await protectedRequest<unknown>(
      `/platform-hardware-lab/runs/${run.id}/report`,
    );
    setReport(hardwareReportSchema.parse(raw));
  };

  useEffect(() => {
    if (tab === 3 && run) {
      void loadReport();
    }
  }, [tab, run?.id]);

  if (loading) {
    return (
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <CircularProgress />
        <Typography sx={{ mt: 2 }}>{text.loading}</Typography>
      </Container>
    );
  }

  if (loadError || !profile) {
    return (
      <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{text.loadError}</Alert>
      </Container>
    );
  }

  const passedSteps = run?.steps.filter((step) => step.status === "PASS").length ?? 0;

  return (
    <Container component="main" maxWidth="xl" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner">
        {text.back}
      </Button>
      <Box sx={{ my: 2 }}>
        <Typography component="h1" variant="h4">
          {text.title}
        </Typography>
        <Typography color="text.secondary" variant="h6">
          {text.subtitle}
        </Typography>
      </Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        {text.intro}
      </Alert>
      <Alert severity="warning" sx={{ mb: 3 }}>
        {text.physical}
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            {text.newRun}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
            }}
          >
            <TextField
              label={text.prototype}
              value={prototypeType}
              onChange={(event) => setPrototypeType(event.target.value)}
            />
            <TextField
              label={text.mainUid}
              value={mainHardwareUid}
              onChange={(event) => setMainHardwareUid(event.target.value)}
            />
            <TextField
              label={text.simSerial}
              value={simD4Serial}
              onChange={(event) => setSimD4Serial(event.target.value)}
            />
            <TextField
              label={text.notes}
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </Box>
          <Button
            disabled={creating || !prototypeType.trim()}
            onClick={() => void createRun()}
            sx={{ mt: 2 }}
            variant="contained"
          >
            {creating ? text.creating : text.create}
          </Button>
        </CardContent>
      </Card>

      {runs.length === 0 ? (
        <Alert severity="info">{text.noRuns}</Alert>
      ) : (
        <TextField
          fullWidth
          label={text.selectRun}
          onChange={(event) => {
            setSelectedRunId(event.target.value);
            setReport(undefined);
          }}
          select
          sx={{ mb: 3 }}
          value={selectedRunId}
        >
          {runs.map((item) => (
            <MenuItem key={item.id} value={item.id}>
              {item.runNumber} — {item.prototypeType} — {item.status}
            </MenuItem>
          ))}
        </TextField>
      )}

      {run ? (
        <>
          <Card variant="outlined" sx={{ mb: 3 }}>
            <CardContent>
              <Stack
                direction={{ xs: "column", md: "row" }}
                divider={<Divider flexItem orientation="vertical" />}
                spacing={2}
              >
                <Box sx={{ flex: 1 }}>
                  <Typography variant="caption">{run.runNumber}</Typography>
                  <Typography variant="h6">{run.prototypeType}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">{text.status}</Typography>
                  <Box>
                    <Chip color={chipColor(run.status)} label={run.status} />
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption">{text.operator}</Typography>
                  <Typography>{run.operatorUsername}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">{text.profile}</Typography>
                  <Typography>{run.profileRevision}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">{text.progress}</Typography>
                  <Typography>
                    {passedSteps}/{profile.steps.length}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption">{text.measurements}</Typography>
                  <Typography>{run.counts.measurements}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption">{text.events}</Typography>
                  <Typography>{run.counts.events}</Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          {notice ? (
            <Alert severity="success" sx={{ mb: 2 }}>
              {notice}
            </Alert>
          ) : null}

          <Tabs
            onChange={(_event, value: number) => setTab(value)}
            scrollButtons="auto"
            sx={{ mb: 3 }}
            value={tab}
            variant="scrollable"
          >
            {text.tabs.map((label) => (
              <Tab key={label} label={label} />
            ))}
          </Tabs>

          {tab === 0 ? (
            <Stack spacing={2}>
              {profile.steps.map((definition) => {
                const result = run.steps.find((step) => step.key === definition.key);
                const reasons = evaluationReasons(result?.evaluation);
                const draft = drafts[definition.key] ?? {};
                return (
                  <Accordion key={definition.key} variant="outlined">
                    <AccordionSummary>
                      <Stack
                        direction="row"
                        spacing={2}
                        sx={{ alignItems: "center", width: "100%" }}
                      >
                        <Typography sx={{ minWidth: 78 }}>{definition.stage}</Typography>
                        <Typography sx={{ flex: 1, fontWeight: 700 }}>
                          {definition.title}
                        </Typography>
                        <Chip
                          color={chipColor(result?.status ?? "PENDING")}
                          label={result?.status ?? "PENDING"}
                          size="small"
                        />
                      </Stack>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography sx={{ fontWeight: 700 }}>
                        {text.instructions}
                      </Typography>
                      <Box component="ol" sx={{ mt: 1 }}>
                        {definition.instructions.map((instruction) => (
                          <li key={instruction}>
                            <Typography>{instruction}</Typography>
                          </li>
                        ))}
                      </Box>
                      {definition.acceptanceNote ? (
                        <Alert severity="info" sx={{ my: 2 }}>
                          <strong>{text.acceptance}: </strong>
                          {definition.acceptanceNote}
                        </Alert>
                      ) : null}
                      <Box
                        sx={{
                          display: "grid",
                          gap: 2,
                          gridTemplateColumns: {
                            xs: "1fr",
                            md: "repeat(2, minmax(0, 1fr))",
                          },
                          my: 2,
                        }}
                      >
                        {definition.fields.map((field) => {
                          const value = draft[field.key];
                          if (field.type === "boolean") {
                            return (
                              <TextField
                                helperText={field.help}
                                key={field.key}
                                label={field.label}
                                onChange={(event) =>
                                  updateDraft(
                                    definition.key,
                                    field.key,
                                    event.target.value === ""
                                      ? null
                                      : event.target.value === "true",
                                  )
                                }
                                required={field.required}
                                select
                                value={
                                  typeof value === "boolean"
                                    ? String(value)
                                    : ""
                                }
                              >
                                <MenuItem value="">{text.pending}</MenuItem>
                                <MenuItem value="true">{text.yes}</MenuItem>
                                <MenuItem value="false">{text.no}</MenuItem>
                              </TextField>
                            );
                          }
                          if (field.type === "choice") {
                            return (
                              <TextField
                                helperText={field.help}
                                key={field.key}
                                label={field.label}
                                onChange={(event) =>
                                  updateDraft(
                                    definition.key,
                                    field.key,
                                    event.target.value,
                                  )
                                }
                                required={field.required}
                                select
                                value={typeof value === "string" ? value : ""}
                              >
                                {(field.options ?? []).map((option) => (
                                  <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                  </MenuItem>
                                ))}
                              </TextField>
                            );
                          }
                          return (
                            <TextField
                              helperText={
                                [field.unit, field.help].filter(Boolean).join(" · ") ||
                                undefined
                              }
                              key={field.key}
                              label={field.label}
                              onChange={(event) =>
                                updateDraft(
                                  definition.key,
                                  field.key,
                                  field.type === "number"
                                    ? event.target.value === ""
                                      ? null
                                      : Number(event.target.value)
                                    : event.target.value,
                                )
                              }
                              required={field.required}
                              type={field.type === "number" ? "number" : "text"}
                              value={
                                typeof value === "string" || typeof value === "number"
                                  ? value
                                  : ""
                              }
                            />
                          );
                        })}
                      </Box>
                      {reasons.length > 0 ? (
                        <Alert severity="error" sx={{ mb: 2 }}>
                          <Typography sx={{ fontWeight: 700 }}>
                            {text.evaluation}
                          </Typography>
                          {reasons.map((reason) => (
                            <Typography key={reason} variant="body2">
                              • {reason}
                            </Typography>
                          ))}
                        </Alert>
                      ) : null}
                      <Button
                        disabled={pendingStep === definition.key}
                        onClick={() => void submitStep(definition)}
                        variant="contained"
                      >
                        {pendingStep === definition.key
                          ? text.saving
                          : text.saveStep}
                      </Button>
                    </AccordionDetails>
                  </Accordion>
                );
              })}

              <Card variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                    {text.measurementRecorder}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    }}
                  >
                    <TextField
                      label={text.step}
                      onChange={(event) => setMeasurementStep(event.target.value)}
                      select
                      value={measurementStep}
                    >
                      {profile.steps.map((step) => (
                        <MenuItem key={step.key} value={step.key}>
                          {step.stage} — {step.title}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label={text.channel}
                      onChange={(event) => setMeasurementChannel(event.target.value)}
                      value={measurementChannel}
                    />
                    <TextField
                      label={text.metric}
                      onChange={(event) => setMeasurementMetric(event.target.value)}
                      value={measurementMetric}
                    />
                    <TextField
                      label={text.numericValue}
                      onChange={(event) => setMeasurementNumeric(event.target.value)}
                      type="number"
                      value={measurementNumeric}
                    />
                    <TextField
                      label={text.textValue}
                      onChange={(event) => setMeasurementText(event.target.value)}
                      value={measurementText}
                    />
                    <TextField
                      label={text.unit}
                      onChange={(event) => setMeasurementUnit(event.target.value)}
                      value={measurementUnit}
                    />
                  </Box>
                  <Button
                    disabled={
                      !measurementStep ||
                      !measurementMetric ||
                      (measurementNumeric === "" && !measurementText)
                    }
                    onClick={() => void addMeasurement()}
                    sx={{ mt: 2 }}
                    variant="outlined"
                  >
                    {text.addMeasurement}
                  </Button>
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                    {text.storedEvidence}
                  </Typography>
                  {storedMeasurements.length === 0 && storedEvents.length === 0 ? (
                    <Typography color="text.secondary">{text.noEvidence}</Typography>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gap: 3,
                        gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                      }}
                    >
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>
                          {text.measurements}
                        </Typography>
                        <Stack divider={<Divider flexItem />} spacing={1} sx={{ mt: 1 }}>
                          {storedMeasurements.slice(0, 20).map((item) => (
                            <Box key={item.id}>
                              <Typography variant="body2">
                                {item.stepKey}
                                {item.channel ? ` · ${item.channel}` : ""} ·{" "}
                                {item.metricKey}
                              </Typography>
                              <Typography color="text.secondary" variant="caption">
                                {item.numericValue ?? item.textValue}
                                {item.unit ? ` ${item.unit}` : ""} · {item.observedAt}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 700 }}>{text.events}</Typography>
                        <Stack divider={<Divider flexItem />} spacing={1} sx={{ mt: 1 }}>
                          {storedEvents.slice(0, 20).map((item) => (
                            <Box key={item.id}>
                              <Stack direction="row" spacing={1}>
                                <Chip
                                  color={
                                    item.severity === "ERROR"
                                      ? "error"
                                      : item.severity === "WARNING"
                                        ? "warning"
                                        : "default"
                                  }
                                  label={item.severity}
                                  size="small"
                                />
                                <Typography variant="body2">
                                  {item.stepKey} · {item.code}
                                </Typography>
                              </Stack>
                              <Typography color="text.secondary" variant="caption">
                                {item.observedAt}
                              </Typography>
                            </Box>
                          ))}
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              <Card variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                    {text.eventRecorder}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(3, 1fr)" },
                    }}
                  >
                    <TextField
                      label={text.step}
                      onChange={(event) => setEventStep(event.target.value)}
                      select
                      value={eventStep}
                    >
                      {profile.steps.map((step) => (
                        <MenuItem key={step.key} value={step.key}>
                          {step.stage} — {step.title}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label={text.faultCode}
                      onChange={(event) => setEventCode(event.target.value)}
                      select
                      value={eventCode}
                    >
                      {profile.faultCodes.map((code) => (
                        <MenuItem key={code} value={code}>
                          {code}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label={text.severity}
                      onChange={(event) => setEventSeverity(event.target.value)}
                      select
                      value={eventSeverity}
                    >
                      {["INFO", "WARNING", "ERROR"].map((severity) => (
                        <MenuItem key={severity} value={severity}>
                          {severity}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Button
                    disabled={!eventStep || !eventCode}
                    onClick={() => void addEvent()}
                    sx={{ mt: 2 }}
                    variant="outlined"
                  >
                    {text.addEvent}
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          ) : null}

          {tab === 1 ? (
            <Stack spacing={3}>
              <Alert severity="info">{text.firmwareIntro}</Alert>
              <Alert severity="info">{text.passive}</Alert>

              <Card variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6">
                    {text.provisioner}
                  </Typography>
                  <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 2 }}>
                    <Button onClick={() => void loadProvisioner()} variant="outlined">
                      {text.refreshPorts}
                    </Button>
                    <TextField
                      label={text.comPort}
                      onChange={(event) => setSelectedPort(event.target.value)}
                      select
                      sx={{ minWidth: 220 }}
                      value={selectedPort}
                    >
                      {ports.map((port) => (
                        <MenuItem key={port.port} value={port.port}>
                          {port.port}
                          {port.name ? ` — ${port.name}` : ""}
                        </MenuItem>
                      ))}
                    </TextField>
                    <Button
                      disabled={!selectedPort}
                      onClick={() => void detectEsp()}
                      variant="outlined"
                    >
                      {text.detectEsp}
                    </Button>
                  </Stack>
                  {provisionerStatus ? (
                    <Typography sx={{ mt: 2 }}>{provisionerStatus}</Typography>
                  ) : null}
                  {detectResult ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography sx={{ fontWeight: 700 }}>
                        {text.detectResult}
                      </Typography>
                      <Typography
                        component="pre"
                        sx={{ overflowX: "auto", whiteSpace: "pre-wrap" }}
                        variant="body2"
                      >
                        {detectResult}
                      </Typography>
                    </Box>
                  ) : null}
                </CardContent>
              </Card>

              {profile.firmwareCatalog.map((item) => (
                <Card key={item.target} variant="outlined">
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", md: "row" }}
                      spacing={2}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <Box>
                        <Typography variant="h6">{item.name}</Typography>
                        <Typography>{item.device}</Typography>
                        <Typography color="text.secondary">{item.purpose}</Typography>
                      </Box>
                      <Chip
                        color={
                          item.availability === "DEVICE_PROVISIONING"
                            ? "success"
                            : "warning"
                        }
                        label={item.availability}
                      />
                    </Stack>
                    <Alert
                      severity={
                        item.availability === "DEVICE_PROVISIONING"
                          ? "success"
                          : "warning"
                      }
                      sx={{ mt: 2 }}
                    >
                      {item.availability === "DEVICE_PROVISIONING"
                        ? text.deviceProvisioning
                        : text.sourceRequired}
                    </Alert>
                  </CardContent>
                </Card>
              ))}

              <Card variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                    {text.firmwareRecord}
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gap: 2,
                      gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                    }}
                  >
                    <TextField
                      label={text.firmwareTarget}
                      onChange={(event) => {
                        const next = event.target.value;
                        setFirmwareTarget(next);
                        setFlashResult("RECORDED");
                        const catalog = profile.firmwareCatalog.find(
                          (item) => item.target === next,
                        );
                        if (catalog) setFirmwareName(catalog.name);
                      }}
                      select
                      value={firmwareTarget}
                    >
                      {profile.firmwareCatalog.map((item) => (
                        <MenuItem key={item.target} value={item.target}>
                          {item.name} — {item.device}
                        </MenuItem>
                      ))}
                    </TextField>
                    <TextField
                      label={text.firmwareName}
                      onChange={(event) => setFirmwareName(event.target.value)}
                      value={firmwareName}
                    />
                    <TextField
                      label={text.firmwareVersion}
                      onChange={(event) => setFirmwareVersion(event.target.value)}
                      value={firmwareVersion}
                    />
                    <TextField
                      label={text.sha256}
                      onChange={(event) => setFirmwareSha(event.target.value)}
                      value={firmwareSha}
                    />
                    <TextField
                      label={text.sourceCommit}
                      onChange={(event) => setFirmwareCommit(event.target.value)}
                      value={firmwareCommit}
                    />
                    <TextField
                      label={text.flashResult}
                      onChange={(event) => setFlashResult(event.target.value)}
                      select
                      value={flashResult}
                    >
                      {(
                        profile.firmwareCatalog.find(
                          (item) => item.target === firmwareTarget,
                        )?.availability === "SOURCE_REQUIRED"
                          ? ["RECORDED", "FAIL"]
                          : ["RECORDED", "PASS", "FAIL"]
                      ).map((result) => (
                        <MenuItem key={result} value={result}>
                          {result}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                  <Button
                    disabled={!firmwareName || !firmwareVersion}
                    onClick={() => void recordFirmware()}
                    sx={{ mt: 2 }}
                    variant="contained"
                  >
                    {text.storeFirmware}
                  </Button>
                </CardContent>
              </Card>
            </Stack>
          ) : null}

          {tab === 2 ? (
            <Card variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
                  {text.history}
                </Typography>
                <Stack divider={<Divider flexItem />} spacing={1}>
                  {runs.map((item) => (
                    <Button
                      key={item.id}
                      onClick={() => {
                        setSelectedRunId(item.id);
                        setTab(0);
                      }}
                      sx={{
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        textAlign: "start",
                      }}
                    >
                      <Box>
                        <Typography>{item.runNumber}</Typography>
                        <Typography color="text.secondary" variant="caption">
                          {item.prototypeType} · {item.operatorUsername}
                        </Typography>
                      </Box>
                      <Stack sx={{ alignItems: "flex-end" }}>
                        <Chip color={chipColor(item.status)} label={item.status} size="small" />
                        <Typography variant="caption">
                          {item.passedSteps}/{item.totalSteps} PASS · {item.failedSteps} FAIL
                        </Typography>
                      </Stack>
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          ) : null}

          {tab === 3 ? (
            <Stack spacing={2}>
              <Card variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: "column", md: "row" }}
                    spacing={2}
                    sx={{
                      alignItems: { xs: "stretch", md: "center" },
                      justifyContent: "space-between",
                    }}
                  >
                    <Box>
                      <Typography component="h2" variant="h6">
                        {text.report}
                      </Typography>
                      <Typography color="text.secondary">
                        {run.runNumber} · {run.profileRevision}
                      </Typography>
                    </Box>
                    <Button onClick={() => void loadReport()} variant="outlined">
                      {text.refreshReport}
                    </Button>
                  </Stack>
                  {report ? (
                    <>
                      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mt: 3 }}>
                        <Box>
                          <Typography variant="caption">{text.finalDecision}</Typography>
                          <Box>
                            <Chip
                              color={report.acceptance.qualified ? "success" : "error"}
                              label={
                                report.acceptance.qualified
                                  ? text.qualified
                                  : text.notQualified
                              }
                            />
                          </Box>
                        </Box>
                        <Box>
                          <Typography variant="caption">{text.passed}</Typography>
                          <Typography>{report.acceptance.passedSteps}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption">{text.failed}</Typography>
                          <Typography>{report.acceptance.failedSteps}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption">{text.pending}</Typography>
                          <Typography>{report.acceptance.pendingSteps}</Typography>
                        </Box>
                      </Stack>
                      <Divider sx={{ my: 3 }} />
                      <Stack spacing={1}>
                        {report.run.steps.map((step) => (
                          <Stack
                            direction="row"
                            key={step.key}
                            sx={{
                              alignItems: "center",
                              justifyContent: "space-between",
                            }}
                          >
                            <Typography>
                              {stepByKey.get(step.key)?.stage} —{" "}
                              {stepByKey.get(step.key)?.title ?? step.key}
                            </Typography>
                            <Chip
                              color={chipColor(step.status)}
                              label={step.status}
                              size="small"
                            />
                          </Stack>
                        ))}
                      </Stack>
                    </>
                  ) : (
                    <CircularProgress size={24} sx={{ mt: 2 }} />
                  )}
                </CardContent>
              </Card>
              {run.status === "QUALIFIED" ? (
                <Button
                  component={Link}
                  to="/system-owner/device-provisioning"
                  variant="contained"
                >
                  {text.proceed}
                </Button>
              ) : (
                <Alert severity="warning">{text.blocked}</Alert>
              )}
            </Stack>
          ) : null}
        </>
      ) : null}
    </Container>
  );
}
