import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Button,
  Container,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useAuthentication } from "../auth/useAuthentication";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { useLocalization } from "../localization/useLocalization";
import type { ApiRequestOptions } from "../api/client";

type Request = <T>(
  path: `/${string}`,
  options?: Omit<ApiRequestOptions, "auth">,
) => Promise<T>;
type Controller = { id: string; name: string; site: string };
type Policy = {
  ethernet: boolean;
  wifi: boolean;
  bluetooth: boolean;
  centralBatteryInstalled: boolean;
};
type State = {
  revision: number;
  appliedRevision: number | null;
  policy: Policy;
  ssid: string;
  passwordConfigured: boolean;
  networkSettingsVersion: number;
  transport: string;
  receivedAt: string | null;
  policyError: string | null;
};
export function AdminMainNetworkSettingsPage() {
  const { protectedRequest, user } = useAuthentication();
  return user?.role === "ADMIN" ? (
    <MainNetworkSettings request={protectedRequest} owner={false} />
  ) : (
    <Alert severity="error">Admin only / للمدير فقط</Alert>
  );
}
export function OwnerMainNetworkSettingsPage() {
  const { apiClient } = usePlatformAuthentication();
  const request = useCallback<Request>(
    (path, options) =>
      apiClient.request(path, { ...options, auth: "protected" }),
    [apiClient],
  );
  return <MainNetworkSettings request={request} owner />;
}
function MainNetworkSettings({
  request,
  owner,
}: {
  request: Request;
  owner: boolean;
}) {
  const { language } = useLocalization(),
    ar = language === "ar";
  const base = owner ? "/owner-network-settings" : "/network-settings";
  const [controllers, setControllers] = useState<Controller[]>([]),
    [binding, setBinding] = useState("");
  const [state, setState] = useState<State | null>(null),
    [policy, setPolicy] = useState<Policy | null>(null);
  const [draftRevision, setDraftRevision] = useState(0);
  const [ssid, setSsid] = useState(""),
    [password, setPassword] = useState(""),
    [replaceWifi, setReplaceWifi] = useState(false);
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  useEffect(() => {
    let live = true;
    void request<{ controllers: Controller[] }>(base)
      .then((v) => {
        if (live) setControllers(v.controllers);
      })
      .catch(() => {
        if (live)
          setError(ar ? "تعذر تحميل الأجهزة" : "Could not load controllers");
      });
    return () => {
      live = false;
    };
  }, [request, base, ar]);
  useEffect(() => {
    let live = true;
    if (!binding) return;
    const load = async (initial: boolean) => {
      try {
        const v = await request<State>(`${base}/${binding}`);
        if (live) {
          setState(v);
          if (initial) {
            setPolicy(v.policy);
            setSsid(v.ssid);
            setDraftRevision(v.revision);
          }
        }
      } catch {
        if (live)
          setError(
            ar
              ? "تعذر قراءة الإعدادات؛ حاول إعادة التحميل"
              : "Could not read settings; reload to retry",
          );
      }
    };
    void load(true);
    const timer = setInterval(() => void load(false), 10000);
    return () => {
      live = false;
      clearInterval(timer);
    };
  }, [binding, request, base, ar]);
  const save = async () => {
    if (!state || !policy) return;
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const v = await request<State>(`${base}/${binding}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expectedRevision: draftRevision,
          ...policy,
          reason,
          ...(replaceWifi ? { wifiCredentials: { ssid, password } } : {}),
        }),
      });
      setState(v);
      setPolicy(v.policy);
      setDraftRevision(v.revision);
      setPassword("");
      setReplaceWifi(false);
      setReason("");
      setMessage(
        ar
          ? "تم الحفظ؛ انتظر تأكيد الجهاز. تغيير غير قابل للاتصال يرجع تلقائيًا، واحفظ إصدارًا جديدًا لإعادة المحاولة."
          : "Saved; awaiting device confirmation. An unreachable change rolls back; save a new revision to retry.",
      );
    } catch {
      setPassword("");
      setError(
        ar
          ? "تعذر الحفظ. راجع الاتصال وصلاحية الجهاز. إذا غيّر مستخدم آخر الإعدادات أعد تحميل الصفحة."
          : "Save failed. Check connection and firmware. Reload if another user changed settings.",
      );
    } finally {
      setBusy(false);
    }
  };
  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button component={Link} to={owner ? "/system-owner" : "/"}>
          {ar ? "رجوع" : "Back"}
        </Button>
        <Typography variant="h4" component="h1">
          {ar
            ? "اتصالات Main والبطارية الاختيارية"
            : "Main connections and optional battery"}
        </Typography>
        <Alert severity="info">
          {ar
            ? "غيّر اتصال جهاز مربوط دون تفليش أو إعادة ربط. الأولوية إيثرنت ثم واي فاي ثم بلوتوث. يلزم مسار اتصال يعمل لإرسال التغيير."
            : "Change a bound controller without flashing or pairing again. Priority: Ethernet, Wi-Fi, Bluetooth. A working path is required to deliver changes."}
        </Alert>
        {error && <Alert severity="error">{error}</Alert>}
        {message && <Alert severity="success">{message}</Alert>}
        {controllers.length === 0 ? (
          <Alert severity="info">
            {ar
              ? "لا يوجد Main مربوط ونشط. أكمل التهيئة الأولى من System Owner، ثم ارجع لهذه الصفحة."
              : "No active bound Main. Complete initial provisioning in System Owner, then return here."}
          </Alert>
        ) : (
          <TextField
            select
            label={ar ? "جهاز Main" : "Main controller"}
            value={binding}
            disabled={busy}
            onChange={(e) => {
              setBinding(e.target.value);
              setState(null);
              setPolicy(null);
              setPassword("");
              setReplaceWifi(false);
              setReason("");
              setError("");
              setMessage("");
            }}
          >
            <MenuItem value="">
              {ar ? "اختر جهازًا" : "Select a controller"}
            </MenuItem>
            {controllers.map((c) => (
              <MenuItem key={c.id} value={c.id}>
                {c.site} / {c.name}
              </MenuItem>
            ))}
          </TextField>
        )}
        {state && policy && (
          <>
            <Typography>
              {ar
                ? "الإصدار المحفوظ / المؤكد من الجهاز"
                : "Saved / device-confirmed revision"}
              : {state.revision} / {state.appliedRevision ?? "—"}
            </Typography>
            <Typography>
              {ar ? "الاتصال الحالي" : "Current connection"}: {state.transport}{" "}
              — {ar ? "آخر اتصال" : "Last contact"}: {state.receivedAt ?? "—"}
            </Typography>
            <Alert
              severity={
                state.appliedRevision === state.revision ? "success" : "info"
              }
            >
              {state.appliedRevision === state.revision
                ? ar
                  ? "أكد الجهاز التطبيق"
                  : "Controller confirmed"
                : ar
                  ? "في انتظار تأكيد الجهاز؛ الحفظ وحده لا يثبت التطبيق"
                  : "Awaiting device confirmation; saving alone does not prove application"}
            </Alert>
            {state.policyError && (
              <Alert severity="warning">
                {ar
                  ? "رجع الجهاز للإعداد السابق؛ احفظ إصدارًا جديدًا لإعادة المحاولة"
                  : "Device rolled back; save a new revision to retry"}
              </Alert>
            )}
            {state.networkSettingsVersion !== 1 && (
              <Alert severity="warning">
                {ar
                  ? "يلزم Main pilot.11 أو أحدث وإرسال حالة الجهاز قبل حفظ هذه الإعدادات."
                  : "Main pilot.11 or later must report health before these settings can be saved."}
              </Alert>
            )}
            {(
              [
                "ethernet",
                "wifi",
                "bluetooth",
                "centralBatteryInstalled",
              ] as const
            ).map((key) => (
              <FormControlLabel
                key={key}
                control={
                  <Switch
                    checked={policy[key]}
                    disabled={busy}
                    onChange={(_, v) => setPolicy({ ...policy, [key]: v })}
                  />
                }
                label={
                  {
                    ethernet: ar
                      ? "إيثرنت — الأولوية الأولى"
                      : "Ethernet — first priority",
                    wifi: ar
                      ? "واي فاي — الأولوية الثانية"
                      : "Wi-Fi — second priority",
                    bluetooth: ar
                      ? "بلوتوث — الأولوية الثالثة"
                      : "Bluetooth — third priority",
                    centralBatteryInstalled: ar
                      ? "البطارية المركزية مركبة (اختياري)"
                      : "Central backup battery installed (optional)",
                  }[key]
                }
              />
            ))}
            <Alert severity="info">
              {ar
                ? "إيثرنت يستخدم DHCP؛ اضبط حجز العنوان من الراوتر عند الحاجة. بلوتوث يستخدم الربط المشفر الحالي تلقائيًا عبر محول الكمبيوتر؛ لا يحتاج PIN أو إعادة pairing."
                : "Ethernet uses DHCP; reserve an address on the router if needed. Bluetooth uses the existing encrypted binding through the PC adapter; no PIN or new pairing is needed."}
            </Alert>
            {!policy.centralBatteryInstalled && (
              <Alert severity="info">
                {ar
                  ? "البطارية غير مركبة: مراقبة مدخلَي الطاقة والبطارية وإنذاراتهما غير مفعلة بعد تأكيد الجهاز. هذا الاختيار لا يتحكم كهربائيًا بالشاحن."
                  : "Battery not fitted: power/battery inputs and their alarms are disabled after device confirmation. This switch does not electrically control the charger."}
              </Alert>
            )}
            <FormControlLabel
              control={
                <Switch
                  checked={replaceWifi}
                  disabled={busy}
                  onChange={(_, v) => {
                    setReplaceWifi(v);
                    setPassword("");
                  }}
                />
              }
              label={
                ar
                  ? "إدخال / تغيير بيانات واي فاي"
                  : "Enter / replace Wi-Fi credentials"
              }
            />
            <Typography>
              {state.passwordConfigured
                ? ar
                  ? "بيانات واي فاي محفوظة؛ عدم اختيار الاستبدال يحتفظ بها"
                  : "Wi-Fi credentials saved; leave replace off to retain them"
                : ar
                  ? "لم تُحفظ بيانات واي فاي من هذه الصفحة؛ قد تكون مضبوطة أثناء التهيئة الأولى"
                  : "No Wi-Fi credentials saved on this page; initial provisioning may already have configured them"}
            </Typography>
            {replaceWifi && (
              <>
                <TextField
                  label={ar ? "اسم شبكة واي فاي" : "Wi-Fi SSID"}
                  value={ssid}
                  disabled={busy}
                  onChange={(e) => setSsid(e.target.value)}
                />
                <TextField
                  label={ar ? "كلمة مرور جديدة" : "New Wi-Fi password"}
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  disabled={busy}
                  onChange={(e) => setPassword(e.target.value)}
                  helperText={
                    ar
                      ? "٨–٦٣ حرفًا إنجليزيًا/رمزًا. كلمة المرور لا تُعرض بعد الحفظ."
                      : "8–63 ASCII characters. The saved password is never displayed."
                  }
                />
              </>
            )}
            <TextField
              label={
                ar
                  ? "سبب التغيير — يسجل مع الحساب"
                  : "Change reason — recorded with account"
              }
              value={reason}
              disabled={busy}
              onChange={(e) => setReason(e.target.value)}
            />
            <Button
              variant="contained"
              disabled={
                busy ||
                state.networkSettingsVersion !== 1 ||
                reason.trim().length < 3 ||
                !(policy.ethernet || policy.wifi || policy.bluetooth) ||
                (replaceWifi && (!ssid || password.length < 8))
              }
              onClick={() => void save()}
            >
              {ar
                ? "حفظ وانتظار تأكيد الجهاز"
                : "Save and await device confirmation"}
            </Button>
          </>
        )}
      </Stack>
    </Container>
  );
}
