import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
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
  useReviseInstallation,
} from "../installations/queries";
import { useLocalization } from "../localization/useLocalization";

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

export function SystemOwnerInstallationsPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const installations = useInstallations();
  const create = useCreateInstallation();
  const revise = useReviseInstallation();
  const action = useInstallationAction();
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
      {installations.data?.map((item) => {
        const next = nextAction(item.status);
        return (
          <Card key={item.uuid} variant="outlined" sx={{ mb: 2 }}>
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
