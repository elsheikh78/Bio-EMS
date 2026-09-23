import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import {
  useCreateInstallation,
  useInstallationAction,
  useInstallations,
  useIssueDevicePairingCode,
  useReviseInstallation,
} from "../installations/queries";
import { useLocalization } from "../localization/useLocalization";
import type { DevicePairingCodeResponse } from "../installations/contracts";

const copy = {
  en: {
    back: "Back to owner console",
    title: "Installation configuration",
    info: "Define customer, Sites, monitored areas, telemetries, devices and channel mappings. Activation requires exact device receipt, technical commissioning and customer ADMIN acceptance.",
    draft: "New installation draft",
    customer: "Customer ID",
    company: "Company name",
    site: "Site code/name",
    area: "Monitored area",
    telemetry: "Telemetry code/name",
    type: "Telemetry type",
    unit: "Unit",
    device: "Device identity",
    channel: "Channel",
    create: "Create controlled draft",
    error: "Draft could not be created.",
    register: "Lifecycle register",
    status: "Status",
    revision: "revision",
    sites: "Sites",
    areas: "Areas",
    telemetries: "Telemetries",
    devices: "Devices",
    mappings: "Mappings",
    pairing: "ESP32 platform pairing",
    pairingHelp:
      "Generate a one-time 12-digit code for the selected device. Enter it on the ESP32 within 10 minutes. The resulting platform binding ID remains stable across Repair/Upgrade.",
    generatePairing: "Generate pairing code",
    pairingCode: "Pairing code",
    pairingExpires: "Expires",
    pairingError: "Pairing code could not be generated.",
    pairingWarning:
      "Use this code once only. Do not store it in firmware or documentation.",
    modify: "Modify installation",
    validate: "Validate",
    queue: "Queue delivery",
    send: "Mark sent",
    technicalDecision: "Record technical decision",
    reviewTitle: "Review changes",
    configurationJson: "Configuration JSON",
    changeReason: "Change reason",
    review: "Review changes",
    apply: "Apply as new revision",
    reviewWarning:
      "A new immutable revision will be created. The last active configuration remains in service until an exact device receipt confirms this revision.",
    revisionError: "Configuration JSON or mapping is invalid.",
    loading: "Loading installation lifecycle…",
    loadError: "Installation lifecycle could not be loaded.",
    retry: "Retry",
    empty: "No installation drafts have been recorded yet.",
    total: "Total installations",
    active: "Active configuration",
    commissioned: "Commissioned",
    telemetryTypes: {
      TEMPERATURE: "Temperature",
      HUMIDITY: "Humidity",
      PRESSURE: "Pressure",
      CO2: "Carbon dioxide",
      DOOR: "Door status",
      OTHER: "Other",
    },
    statuses: {
      DRAFT: "Draft",
      VALIDATED: "Validated",
      PENDING_DELIVERY: "Pending delivery",
      SENT: "Sent",
      CONFIG_ACTIVE: "Configuration active",
      COMMISSIONED: "Commissioned",
      CORRECTION_REQUIRED: "Correction required",
    },
  },
  ar: {
    back: "العودة إلى لوحة مالك النظام",
    title: "تهيئة التركيب",
    info: "عرّف العميل والمواقع والمناطق المراقبة والقياسات والأجهزة وربط القنوات. يتطلب التفعيل إيصال جهاز مطابقاً واعتماداً فنياً وقبول مدير العميل.",
    draft: "مسودة تركيب جديدة",
    customer: "رقم العميل",
    company: "اسم الشركة",
    site: "كود واسم الموقع",
    area: "المنطقة المراقبة",
    telemetry: "كود واسم القياس",
    type: "نوع القياس",
    unit: "الوحدة",
    device: "هوية الجهاز",
    channel: "القناة",
    create: "إنشاء مسودة محكومة",
    error: "تعذر إنشاء المسودة.",
    register: "سجل دورة الحياة",
    status: "الحالة",
    revision: "المراجعة",
    sites: "المواقع",
    areas: "المناطق",
    telemetries: "القياسات",
    devices: "الأجهزة",
    mappings: "الروابط",
    pairing: "ربط ESP32 بالمنصة",
    pairingHelp:
      "أنشئ كود ربط مكوّنًا من 12 رقمًا للجهاز المطلوب. أدخله على ESP32 خلال 10 دقائق. يظل رقم ربط المنصة الناتج ثابتًا مع Repair/Upgrade.",
    generatePairing: "إنشاء كود الربط",
    pairingCode: "كود الربط",
    pairingExpires: "تنتهي الصلاحية",
    pairingError: "تعذر إنشاء كود الربط.",
    pairingWarning:
      "يستخدم هذا الكود مرة واحدة فقط. لا تحفظه داخل الـFirmware أو التوثيق.",
    modify: "تعديل التركيب",
    validate: "التحقق",
    queue: "إدراج للإرسال",
    send: "تسجيل الإرسال",
    technicalDecision: "تسجيل القرار الفني",
    reviewTitle: "مراجعة التغييرات",
    configurationJson: "تهيئة JSON",
    changeReason: "سبب التغيير",
    review: "مراجعة التغييرات",
    apply: "تطبيق كمراجعة جديدة",
    reviewWarning:
      "ستُنشأ مراجعة ثابتة جديدة، وتظل آخر تهيئة نشطة في الخدمة حتى يؤكد إيصال مطابق من الجهاز هذه المراجعة.",
    revisionError: "تهيئة JSON أو ربط القنوات غير صالح.",
    loading: "جارٍ تحميل دورة حياة التركيبات…",
    loadError: "تعذر تحميل دورة حياة التركيبات.",
    retry: "إعادة المحاولة",
    empty: "لم يتم تسجيل مسودات تركيب حتى الآن.",
    total: "إجمالي التركيبات",
    active: "تهيئة نشطة",
    commissioned: "تم تشغيلها مبدئيًا",
    telemetryTypes: {
      TEMPERATURE: "درجة الحرارة",
      HUMIDITY: "الرطوبة",
      PRESSURE: "الضغط",
      CO2: "ثاني أكسيد الكربون",
      DOOR: "حالة الباب",
      OTHER: "أخرى",
    },
    statuses: {
      DRAFT: "مسودة",
      VALIDATED: "تم التحقق",
      PENDING_DELIVERY: "بانتظار الإرسال",
      SENT: "تم الإرسال",
      CONFIG_ACTIVE: "التهيئة نشطة",
      COMMISSIONED: "تم التشغيل المبدئي",
      CORRECTION_REQUIRED: "يتطلب تصحيحاً",
    },
  },
} as const;

function installationDeviceIds(snapshot: Record<string, unknown>): string[] {
  const devices = snapshot.devices;
  if (!Array.isArray(devices)) return [];
  return devices.flatMap((device) => {
    if (!device || typeof device !== "object") return [];
    const deviceId = (device as Record<string, unknown>).deviceId;
    return typeof deviceId === "string" && deviceId.length > 0 ? [deviceId] : [];
  });
}

export function SystemOwnerInstallationsPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const installations = useInstallations();
  const create = useCreateInstallation();
  const revise = useReviseInstallation();
  const action = useInstallationAction();
  const issuePairing = useIssueDevicePairingCode();
  const [pairingResult, setPairingResult] = useState<DevicePairingCodeResponse | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [company, setCompany] = useState("");
  const [site, setSite] = useState("");
  const [area, setArea] = useState("");
  const [telemetry, setTelemetry] = useState("");
  const [type, setType] = useState("TEMPERATURE");
  const [unit, setUnit] = useState("°C");
  const [device, setDevice] = useState("");
  const [channel, setChannel] = useState("0");
  const [editing, setEditing] = useState<{ uuid: string; json: string } | null>(
    null,
  );
  const [reason, setReason] = useState("");
  const [review, setReview] = useState(false);
  const [revisionError, setRevisionError] = useState(false);
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({
      customerId: Number(customerId),
      snapshot: {
        companyName: company,
        sites: [
          {
            code: site,
            name: site,
            timezone: "Africa/Cairo",
            areas: [
              {
                code: area,
                name: area,
                telemetries: [
                  {
                    code: telemetry,
                    name: telemetry,
                    type,
                    unit,
                    warningDelaySeconds: 0,
                    criticalDelaySeconds: 0,
                    calibrationOffset: 0,
                  },
                ],
              },
            ],
          },
        ],
        devices: [
          {
            deviceId: device,
            siteCode: site,
            type: "zone-controller",
            protocol: "mqtt",
            mappings: [
              {
                areaCode: area,
                telemetryCode: telemetry,
                channel: Number(channel),
              },
            ],
          },
        ],
      },
    });
  };
  const nextAction = (status: string) =>
    status === "DRAFT"
      ? "validate"
      : status === "VALIDATED"
        ? "queue"
        : status === "PENDING_DELIVERY"
          ? "send"
          : status === "CONFIG_ACTIVE"
            ? "technical-decision"
            : undefined;
  const actionLabel = (actionName: string) =>
    ({
      validate: text.validate,
      queue: text.queue,
      send: text.send,
      "technical-decision": text.technicalDecision,
    })[actionName] ?? actionName;
  const statusLabel = (status: string) =>
    text.statuses[status as keyof typeof text.statuses] ?? status;
  const records = installations.data ?? [];
  const activeCount = records.filter(
    (item) => item.status === "CONFIG_ACTIVE",
  ).length;
  const commissionedCount = records.filter(
    (item) => item.status === "COMMISSIONED",
  ).length;
  return (
    <Container component="main" maxWidth="lg" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner">
        {text.back}
      </Button>
      <Typography component="h1" variant="h4" sx={{ my: 2 }}>
        {text.title}
      </Typography>
      <Alert severity="info" sx={{ mb: 2 }}>
        {text.info}
      </Alert>
      {installations.isPending ? (
        <Box
          role="status"
          sx={{ alignItems: "center", display: "flex", gap: 2, mb: 3 }}
        >
          <CircularProgress size={24} />
          <Typography>{text.loading}</Typography>
        </Box>
      ) : null}
      {installations.isError ? (
        <Alert
          severity="error"
          action={
            <Button onClick={() => void installations.refetch()}>
              {text.retry}
            </Button>
          }
          sx={{ mb: 3 }}
        >
          {text.loadError}
        </Alert>
      ) : null}
      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6">
            {text.draft}
          </Typography>
          <Box
            component="form"
            onSubmit={(e) => void submit(e)}
            sx={{
              display: "grid",
              gap: 2,
              mt: 2,
              gridTemplateColumns: { xs: "1fr", md: "repeat(3,1fr)" },
            }}
          >
            <TextField
              required
              label={text.customer}
              type="number"
              value={customerId}
              onChange={(e) => setCustomerId(e.target.value)}
            />
            <TextField
              required
              label={text.company}
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <TextField
              required
              label={text.site}
              value={site}
              onChange={(e) => setSite(e.target.value)}
            />
            <TextField
              required
              label={text.area}
              value={area}
              onChange={(e) => setArea(e.target.value)}
            />
            <TextField
              required
              label={text.telemetry}
              value={telemetry}
              onChange={(e) => setTelemetry(e.target.value)}
            />
            <TextField
              select
              label={text.type}
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              {(
                [
                  "TEMPERATURE",
                  "HUMIDITY",
                  "PRESSURE",
                  "CO2",
                  "DOOR",
                  "OTHER",
                ] as const
              ).map((x) => (
                <MenuItem key={x} value={x}>
                  {text.telemetryTypes[x]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              required
              label={text.unit}
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
            />
            <TextField
              required
              label={text.device}
              value={device}
              onChange={(e) => setDevice(e.target.value)}
            />
            <TextField
              required
              label={text.channel}
              type="number"
              value={channel}
              onChange={(e) => setChannel(e.target.value)}
            />
            <Button
              type="submit"
              variant="contained"
              disabled={create.isPending}
            >
              {text.create}
            </Button>
          </Box>
          {create.isError ? (
            <Alert severity="error" sx={{ mt: 2 }}>
              {text.error}
            </Alert>
          ) : null}
        </CardContent>
      </Card>
      <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
        {text.register}
      </Typography>
      {!installations.isPending &&
      !installations.isError &&
      records.length === 0 ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {text.empty}
        </Alert>
      ) : null}
      {records.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            mb: 3,
          }}
        >
          {[
            [text.total, records.length, "primary.main"],
            [text.active, activeCount, "success.main"],
            [text.commissioned, commissionedCount, "info.main"],
          ].map(([label, value, color]) => (
            <Card
              key={String(label)}
              variant="outlined"
              sx={{ borderInlineStart: 5, borderInlineStartColor: color }}
            >
              <CardContent>
                <Typography color="text.secondary" variant="body2">
                  {label}
                </Typography>
                <Typography variant="h4" sx={{ color, fontWeight: 800 }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : null}
      {records.map((item) => {
        const next = nextAction(item.status);
        return (
          <Card
            key={item.uuid}
            variant="outlined"
            sx={{
              borderInlineStart: 5,
              borderInlineStartColor:
                item.status === "COMMISSIONED"
                  ? "success.main"
                  : item.status === "CORRECTION_REQUIRED"
                    ? "error.main"
                    : "warning.main",
              mb: 2,
            }}
          >
            <CardContent>
              <Typography variant="h6">
                {item.customerName} — {text.revision} {item.latestRevision}
              </Typography>
              <Typography color="text.secondary">{item.uuid}</Typography>
              <Typography>
                {text.status}: {statusLabel(item.status)}
              </Typography>
              <Typography>
                {text.sites} {item.summary.sites} · {text.areas}{" "}
                {item.summary.areas} · {text.telemetries}{" "}
                {item.summary.telemetries} · {text.devices}{" "}
                {item.summary.devices} · {text.mappings} {item.summary.mappings}
              </Typography>
              <Box sx={{ mt: 2 }}>
                <Typography sx={{ fontWeight: 700 }}>{text.pairing}</Typography>
                <Typography color="text.secondary" variant="body2" sx={{ mb: 1 }}>
                  {text.pairingHelp}
                </Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                  {installationDeviceIds(item.latestSnapshot).map((deviceId) => (
                    <Button
                      key={deviceId}
                      variant="outlined"
                      disabled={issuePairing.isPending}
                      onClick={() => {
                        setPairingResult(null);
                        void issuePairing
                          .mutateAsync({
                            installationId: item.uuid,
                            deviceId,
                          })
                          .then(setPairingResult);
                      }}
                    >
                      {text.generatePairing}: {deviceId}
                    </Button>
                  ))}
                </Box>
                {issuePairing.isError ? (
                  <Alert severity="error" sx={{ mt: 1 }}>
                    {text.pairingError}
                  </Alert>
                ) : null}
                {pairingResult?.installation_id === item.uuid ? (
                  <Alert severity="warning" sx={{ mt: 1 }}>
                    <Typography component="div" sx={{ fontWeight: 800 }}>
                      {text.pairingCode}: {pairingResult.pairing_code}
                    </Typography>
                    <Typography component="div" variant="body2">
                      {text.pairingExpires}: {new Date(pairingResult.expires_at).toLocaleString()}
                    </Typography>
                    <Typography component="div" variant="body2">
                      {text.pairingWarning}
                    </Typography>
                  </Alert>
                ) : null}
              </Box>
              <Button
                sx={{ mt: 1, mr: 1 }}
                variant="outlined"
                onClick={() => {
                  setEditing({
                    uuid: item.uuid,
                    json: JSON.stringify(item.latestSnapshot, null, 2),
                  });
                  setReason("");
                  setReview(false);
                }}
              >
                {text.modify}
              </Button>
              {next ? (
                <Button
                  sx={{ mt: 1 }}
                  variant="outlined"
                  disabled={action.isPending}
                  onClick={() =>
                    void action.mutateAsync({
                      uuid: item.uuid,
                      action: next,
                      body:
                        next === "technical-decision"
                          ? {
                              decision: "ACCEPT",
                              note: "Technical commissioning passed",
                            }
                          : undefined,
                    })
                  }
                >
                  {actionLabel(next)}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
      {editing ? (
        <Card variant="outlined">
          <CardContent>
            <Typography component="h2" variant="h6">
              {text.reviewTitle}
            </Typography>
            <TextField
              label={text.configurationJson}
              multiline
              minRows={12}
              fullWidth
              value={editing.json}
              onChange={(e) => {
                setEditing({ ...editing, json: e.target.value });
                setReview(false);
              }}
              sx={{ my: 2 }}
            />
            <TextField
              required
              label={text.changeReason}
              fullWidth
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              sx={{ mt: 2, mr: 1 }}
              onClick={() => {
                try {
                  JSON.parse(editing.json);
                  setReview(true);
                  setRevisionError(false);
                } catch {
                  setRevisionError(true);
                }
              }}
            >
              {text.review}
            </Button>
            <Button
              sx={{ mt: 2 }}
              variant="contained"
              disabled={!review || !reason || revise.isPending}
              onClick={() =>
                void revise
                  .mutateAsync({
                    uuid: editing.uuid,
                    snapshot: JSON.parse(editing.json),
                    reason,
                  })
                  .then(() => setEditing(null))
                  .catch(() => setRevisionError(true))
              }
            >
              {text.apply}
            </Button>
            {review ? (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {text.reviewWarning}
              </Alert>
            ) : null}
            {revisionError ? (
              <Alert severity="error" sx={{ mt: 2 }}>
                {text.revisionError}
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}
    </Container>
  );
}
