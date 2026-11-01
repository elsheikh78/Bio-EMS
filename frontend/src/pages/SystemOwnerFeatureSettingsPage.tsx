import { controllerHealthLabel } from "../alarms/controllerHealthLabels";
import {
  Alert,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { useLocalization } from "../localization/useLocalization";

type Policy = { revision: number; policy: Record<string, boolean | number> };
type Controller = {
  id: string;
  name: string;
  site: string;
  appliedRevision: number | null;
  healthJson: string | null;
  receivedAt: string | null;
};
type Alarm = {
  id: number;
  binding_id: string;
  code: string;
  status: string;
  trigger_time: string;
};
const labels: Record<string, [string, string]> = {
  ethernet: ["Ethernet (first priority)", "إيثرنت — الأولوية الأولى"],
  wifi: ["Wi-Fi (second priority)", "واي فاي — الأولوية الثانية"],
  bluetooth: ["Bluetooth BLE (third priority)", "بلوتوث — الأولوية الثالثة"],
  offlineStorage: ["microSD buffering", "التخزين على كارت الذاكرة"],
  automaticReplay: ["Automatic replay", "استرجاع البيانات تلقائيًا"],
  centralBatteryInstalled: [
    "Central backup battery installed (optional)",
    "البطارية المركزية مركبة — اختياري",
  ],
  powerAlarms: ["Critical power alarms", "إنذارات الكهرباء الحرجة"],
  storageAlarms: ["Critical storage alarms", "إنذارات التخزين الحرجة"],
  reports: ["Reports", "التقارير"],
  calibration: ["Calibration", "المعايرة"],
  notifications: ["External notification delivery", "إرسال الإخطارات الخارجية"],
  backups: ["Manual and scheduled backups", "النسخ الاحتياطي اليدوي والمجدول"],
  updates: ["Client updates", "تحديثات العميل"],
};
export function SystemOwnerFeatureSettingsPage() {
  const { apiClient } = usePlatformAuthentication();
  const { language } = useLocalization();
  const ar = language === "ar";
  const [scope, setScope] = useState("platform"),
    [data, setData] = useState<Policy | null>(null);
  const [controllers, setControllers] = useState<Controller[]>([]),
    [alarms, setAlarms] = useState<Alarm[]>([]);
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  const [error, setError] = useState("");
  useEffect(() => {
    let live = true;
    const load = async () => {
      try {
        const result = await apiClient.request<{
          controllers: Controller[];
          alarms: Alarm[];
        }>("/feature-settings", { auth: "protected" });
        if (live) {
          setControllers(result.controllers);
          setAlarms(result.alarms);
        }
      } catch {
        if (live)
          setError(
            ar ? "تعذر تحميل حالة الأجهزة" : "Could not load controller status",
          );
      }
    };
    void load();
    const timer = setInterval(() => void load(), 10000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [apiClient, ar]);
  useEffect(() => {
    let live = true;
    void apiClient
      .request<Policy>(`/feature-settings/${scope}`, { auth: "protected" })
      .then((value) => {
        if (live) setData(value);
      })
      .catch(() => {
        if (live)
          setError(ar ? "تعذر تحميل الإعدادات" : "Could not load settings");
      });
    return () => {
      live = false;
    };
  }, [apiClient, scope, ar]);
  const selected = controllers.find((c) => c.id === scope);
  const health = selected?.healthJson
    ? (JSON.parse(selected.healthJson) as Record<string, unknown>)
    : null;
  const healthFields: [string, string, string][] = [
    ["transport", "Current connection", "الاتصال الحالي"],
    ["storage", "Storage state", "حالة الذاكرة"],
    ["storageUsedPercent", "Storage used %", "المساحة المستخدمة ٪"],
    ["queued", "Pending records", "القراءات المنتظرة"],
    ["mains", "Main supply present", "التغذية الرئيسية متاحة"],
    ["batteryLow", "Backup battery low", "انخفاض البطارية الاحتياطية"],
    ["policyError", "Settings fault", "خطأ الإعدادات"],
  ];
  const save = async () => {
    if (!data) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const value = await apiClient.request<Policy>(
        `/feature-settings/${scope}`,
        {
          auth: "protected",
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            expectedRevision: data.revision,
            policy: data.policy,
            reason,
          }),
        },
      );
      setData(value);
      setReason("");
      setMessage(
        ar
          ? scope === "platform"
            ? "تم تطبيق إعدادات المنصة"
            : "تم الحفظ — في انتظار تأكيد الجهاز"
          : scope === "platform"
            ? "Platform settings applied"
            : "Saved — awaiting controller confirmation",
      );
    } catch {
      setError(
        ar
          ? "تعذر الحفظ. تحقق من وجود اتصال مفعّل وسبب التغيير. عند تعارض الإصدار، أعد تحميل الصفحة."
          : "Save failed. Keep a communication path enabled, enable storage for replay, and enter a reason. Reload if another owner changed the revision.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button component={Link} to="/system-owner">
          {ar ? "الرجوع للوحة مالك النظام" : "Back to owner console"}
        </Button>
        <Typography variant="h4" component="h1">
          {ar ? "إعدادات خصائص النظام" : "System feature settings"}
        </Typography>
        <Alert severity="info">
          {ar
            ? "إعدادات المنصة تطبق على هذا التثبيت. إعدادات Main مستقلة لكل جهاز وتنتظر تأكيده. المصادقة وسجل المراجعة وحماية الاتصال تظل إلزامية."
            : "Platform settings apply to this installation. Main settings are per controller and require its acknowledgement. Authentication, audit history and transport security remain mandatory."}
        </Alert>
        <Button component={Link} to="/system-owner/network-settings">
          {ar
            ? "إعداد اتصالات Main والبطارية"
            : "Main network and optional battery settings"}
        </Button>
        <TextField
          select
          label={ar ? "نطاق الإعدادات" : "Settings scope"}
          value={scope}
          onChange={(e) => {
            setScope(e.target.value);
            setData(null);
            setReason("");
            setMessage("");
            setError("");
          }}
          disabled={busy}
        >
          <MenuItem value="platform">
            {ar ? "منصة العميل المحلية" : "Local client platform"}
          </MenuItem>
          {controllers.map((c) => (
            <MenuItem key={c.id} value={c.id}>
              {c.site} / {c.name}
            </MenuItem>
          ))}
        </TextField>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {data && (
          <Card>
            <CardContent>
              <Stack spacing={2}>
                <Typography>
                  {ar ? "الإصدار المحفوظ" : "Saved revision"}: {data.revision}
                </Typography>
                {selected && (
                  <>
                    <Chip
                      color={
                        selected.appliedRevision === data.revision
                          ? "success"
                          : "warning"
                      }
                      label={
                        selected.appliedRevision === data.revision
                          ? ar
                            ? "أكد الجهاز التطبيق"
                            : "Controller confirmed"
                          : ar
                            ? "في انتظار تأكيد الجهاز"
                            : "Awaiting controller confirmation"
                      }
                    />
                    <Typography variant="body2">
                      {ar ? "آخر اتصال" : "Last contact"}:{" "}
                      {selected.receivedAt ?? "—"}
                    </Typography>
                    {health ? (
                      healthFields
                        .filter(
                          ([key]) =>
                            key in health &&
                            (!["mains", "batteryLow"].includes(key) ||
                              data.policy.centralBatteryInstalled === true),
                        )
                        .map(([key, en, arabic]) => (
                          <Typography key={key} variant="body2">
                            {ar ? arabic : en}:{" "}
                            {health[key] === null
                              ? ar
                                ? "غير مقاس"
                                : "Not measured"
                              : typeof health[key] === "boolean"
                                ? health[key]
                                  ? ar
                                    ? "نعم"
                                    : "Yes"
                                  : ar
                                    ? "لا"
                                    : "No"
                                : typeof health[key] === "string" ||
                                    typeof health[key] === "number"
                                  ? `${health[key]}`
                                  : "—"}
                          </Typography>
                        ))
                    ) : (
                      <Typography>
                        {ar
                          ? "لم تصل حالة الجهاز بعد"
                          : "No controller health received yet"}
                      </Typography>
                    )}
                  </>
                )}
                {Object.entries(data.policy)
                  .filter(([key]) => key in labels)
                  .map(([key, value]) => (
                    <FormControlLabel
                      key={key}
                      label={labels[key][ar ? 1 : 0]}
                      control={
                        <Switch
                          disabled={busy}
                          checked={value === true}
                          onChange={(_, checked) =>
                            setData({
                              ...data,
                              policy: { ...data.policy, [key]: checked },
                            })
                          }
                        />
                      }
                    />
                  ))}
                {selected && data.policy.centralBatteryInstalled !== true && (
                  <Alert severity="info">
                    {ar
                      ? "البطارية المركزية غير مركبة: مراقبة الطاقة والبطارية غير مفعلة. لا يفصل هذا الاختيار الشاحن كهربائيًا."
                      : "Optional central battery not fitted: power/battery supervision is disabled. This does not electrically switch the charger."}
                  </Alert>
                )}
                {scope !== "platform" && (
                  <TextField
                    type="number"
                    label={
                      ar
                        ? "حد إنذار امتلاء الذاكرة ٪ (٥٠–٩٥)"
                        : "Storage warning % (50–95)"
                    }
                    value={data.policy.storageWarningPercent}
                    onChange={(e) =>
                      setData({
                        ...data,
                        policy: {
                          ...data.policy,
                          storageWarningPercent: Number(e.target.value),
                        },
                      })
                    }
                  />
                )}
                {Object.entries(data.policy).some(
                  ([key, value]) =>
                    [
                      "offlineStorage",
                      "automaticReplay",
                      "powerAlarms",
                      "storageAlarms",
                      "notifications",
                      "backups",
                    ].includes(key) && value === false,
                ) && (
                  <Alert severity="warning">
                    {ar
                      ? "تعطيل التخزين أو الإنذارات أو الإخطارات أو النسخ الاحتياطي يقلل حماية النظام. البيانات القديمة لا تُحذف، وتعطيل الاسترجاع يوقف مزامنتها."
                      : "Disabling storage, alarms, notifications or backups reduces protection. Existing queued data is retained; disabling replay pauses its synchronization."}
                  </Alert>
                )}
                <TextField
                  label={
                    ar
                      ? "سبب التغيير — يسجل مع حساب المالك"
                      : "Reason — recorded with owner identity"
                  }
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  disabled={busy}
                />
                <Button
                  variant="contained"
                  onClick={() => void save()}
                  disabled={busy || reason.trim().length < 3}
                >
                  {ar ? "حفظ الإعدادات" : "Save settings"}
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
        <Typography variant="h5">
          {ar ? "إنذارات Main — أولوية قصوى" : "Main alarms — highest priority"}
        </Typography>
        {alarms
          .filter((a) => scope === "platform" || a.binding_id === scope)
          .map((a) => (
            <Alert
              severity={a.status === "RECOVERED" ? "success" : "error"}
              key={a.id}
              action={
                a.status === "TRIGGERED" ? (
                  <Button
                    onClick={() => {
                      void apiClient
                        .request(
                          `/feature-settings/alarms/${a.id}/acknowledge`,
                          { auth: "protected", method: "POST" },
                        )
                        .then(() =>
                          setAlarms((old) =>
                            old.map((item) =>
                              item.id === a.id
                                ? { ...item, status: "ACKNOWLEDGED" }
                                : item,
                            ),
                          ),
                        )
                        .catch(() =>
                          setError(
                            ar
                              ? "تعذر الإقرار بالإنذار"
                              : "Could not acknowledge alarm",
                          ),
                        );
                    }}
                  >
                    {ar ? "إقرار" : "Acknowledge"}
                  </Button>
                ) : undefined
              }
            >
              {controllerHealthLabel(a.code, ar)} — CRITICAL — {a.status} —{" "}
              {a.trigger_time}
            </Alert>
          ))}
      </Stack>
    </Container>
  );
}
