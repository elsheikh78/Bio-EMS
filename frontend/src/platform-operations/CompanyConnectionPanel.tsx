import {
  Alert,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { companyCloudMode } from "../api/companyTransport";
import { useLocalization } from "../localization/useLocalization";

interface Status {
  enabled: boolean;
  url?: string;
  siteId?: string;
  remoteControl: boolean;
  lastSuccess: string | null;
  lastError: string | null;
}
export function CompanyConnectionPanel() {
  const { apiClient } = usePlatformAuthentication();
  const { language } = useLocalization();
  const ar = language === "ar";
  const [status, setStatus] = useState<Status>();
  const [url, setUrl] = useState("");
  const [siteId, setSiteId] = useState("");
  const [token, setToken] = useState("");
  const [remote, setRemote] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  useEffect(() => {
    if (companyCloudMode()) return;
    let active = true;
    const refresh = () =>
      void apiClient
        .request<Status>("/platform-operations/company-connection", {
          auth: "protected",
        })
        .then((value) => {
          if (active) setStatus(value);
        })
        .catch(() => {
          if (active) setError(true);
        });
    refresh();
    const interval = setInterval(refresh, 60_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [apiClient]);
  if (companyCloudMode())
    return (
      <Alert severity="info" sx={{ mb: 3 }}>
        {ar
          ? "أنت تتحكم في الموقع المحدد عن بُعد. نقل ملفات التحديث والنسخ الاحتياطية يتم محليًا في البيلوت."
          : "Remote control of the selected site. Update and backup file transfers remain local in this pilot."}
        <Button href="/">
          {ar ? "العودة لمنصة الشركة" : "Company portal"}
        </Button>
      </Alert>
    );
  async function save(disable = false) {
    setBusy(true);
    setError(false);
    try {
      const value = await apiClient.request<Status>(
        "/platform-operations/company-connection",
        {
          auth: "protected",
          method: disable ? "DELETE" : "PUT",
          headers: { "Content-Type": "application/json" },
          body: disable
            ? undefined
            : JSON.stringify({ url, siteId, token, remoteControl: remote }),
        },
      );
      setStatus(value);
      setToken("");
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Box
      sx={{ mb: 3, p: 2, border: 1, borderColor: "divider", borderRadius: 2 }}
    >
      <Typography variant="h6">
        {ar ? "الاتصال بمنصة الشركة" : "Company platform connection"}
      </Typography>
      <Typography sx={{ mb: 2 }}>
        {ar
          ? "اختياري أثناء البيلوت. أدخل بيانات الربط الصادرة من منصة الشركة. تعطيل الاتصال لا يؤثر على المراقبة المحلية."
          : "Optional pilot connection. Use enrollment details from the company portal. Disabling it preserves local monitoring."}
      </Typography>
      {status && (
        <Alert severity={status.lastError ? "warning" : "info"} sx={{ mb: 2 }}>
          {status.enabled
            ? `${status.url} — ${status.lastSuccess || (ar ? "بانتظار الاتصال" : "Awaiting connection")} ${status.lastError || ""}`
            : ar
              ? "غير متصل بمنصة الشركة"
              : "Company connection disabled"}
        </Alert>
      )}
      {error && (
        <Alert severity="error">
          {ar
            ? "تعذر حفظ/قراءة الربط. تحقق من البيانات ومفتاح تشفير مالك النظام."
            : "Connection failed. Check enrollment details and owner encryption configuration."}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField
          label={ar ? "عنوان منصة الشركة HTTPS" : "Company HTTPS address"}
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />
        <TextField
          label={ar ? "كود الربط الخاص بالموقع" : "Site connection ID"}
          value={siteId}
          onChange={(e) => setSiteId(e.target.value)}
        />
        <TextField
          type="password"
          autoComplete="off"
          label={
            ar
              ? "رمز الاتصال — لا يظهر بعد الحفظ"
              : "Connection token — hidden after saving"
          }
          value={token}
          onChange={(e) => setToken(e.target.value)}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={remote}
              onChange={(e) => setRemote(e.target.checked)}
            />
          }
          label={
            ar
              ? "السماح بالتحكم عن بُعد مع تسجيل دخول System Owner وMFA"
              : "Allow remote control using System Owner login and MFA"
          }
        />
        <Stack direction="row" spacing={2}>
          <Button
            variant="contained"
            disabled={busy || !url || !siteId || !token}
            onClick={() => void save()}
          >
            {ar ? "حفظ الربط" : "Save connection"}
          </Button>
          <Button
            color="error"
            disabled={busy || !status?.enabled}
            onClick={() => void save(true)}
          >
            {ar ? "تعطيل الربط" : "Disable connection"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}
