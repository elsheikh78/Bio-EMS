import {
  Alert,
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import QRCode from "qrcode";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { ownerMfaResetResponseSchema } from "../platform-auth/contracts";
import { BrandLogo } from "../components/BrandLogo";

const copy = {
  en: {
    title: "System Owner Console",
    subtitle: "Platform operations",
    signedIn: "Signed in as",
    logout: "Sign out",
    foundation:
      "Manage the platform customer fleet, licenses, update eligibility and service obligations.",
    open: "Open",
    modules: [
      { key: "customers", label: "Customer fleet" },
      { key: "admins", label: "Customer ADMIN accounts" },
      { key: "communication-channels", label: "Communication channels" },
      { key: "installations", label: "Installation configuration" },
      { key: "licenses", label: "Licenses & installations" },
      { key: "updates", label: "Update entitlements" },
      { key: "service", label: "Maintenance, calibration & support" },
      { key: "backup-restore", label: "Backup & Restore" },
    ],
    mfaTitle: "MFA security",
    mfaDescription:
      "Rotate the System Owner authenticator secret. This revokes all current owner sessions.",
    rotate: "Rotate MFA",
    dialogTitle: "Rotate System Owner MFA",
    reauthHelp:
      "Confirm your current password and current authenticator code. BIO-EMS will revoke the old MFA secret and all owner sessions, then create a new enrollment.",
    currentPassword: "Current password",
    currentCode: "Current authenticator code",
    continue: "Create new MFA enrollment",
    working: "Working…",
    cancel: "Cancel",
    enrollmentHelp:
      "Scan this new QR code with your authenticator app, then enter the new six-digit code. Remove the old BIO-EMS entry from your authenticator after the new MFA is confirmed.",
    setupKey: "New authenticator setup key",
    newCode: "New authenticator code",
    activate: "Activate new MFA",
    activating: "Activating…",
    failed:
      "MFA rotation failed. Verify the current password/code and try again.",
    confirmFailed:
      "The new authenticator code was rejected. Use the current code from the new QR enrollment.",
    success:
      "MFA was rotated. All previous owner sessions and the old MFA secret are no longer valid.",
  },
  ar: {
    title: "لوحة مالك النظام",
    subtitle: "عمليات إدارة المنصة",
    signedIn: "تم تسجيل الدخول باسم",
    logout: "تسجيل الخروج",
    foundation: "إدارة عملاء المنصة والتراخيص وأهلية التحديث والتزامات الخدمة.",
    open: "فتح",
    modules: [
      { key: "customers", label: "العملاء والمواقع" },
      { key: "admins", label: "إدارة حسابات Admin" },
      { key: "communication-channels", label: "قنوات الاتصال" },
      { key: "installations", label: "تهيئة التركيبات" },
      { key: "licenses", label: "التراخيص والتركيبات" },
      { key: "updates", label: "استحقاقات التحديث" },
      { key: "service", label: "الصيانة والمعايرة والدعم" },
      { key: "backup-restore", label: "النسخ الاحتياطي والاستعادة" },
    ],
    mfaTitle: "أمان المصادقة الثنائية",
    mfaDescription:
      "تدوير مفتاح تطبيق المصادقة لمالك النظام. سيتم إلغاء جميع جلسات المالك الحالية.",
    rotate: "تغيير MFA",
    dialogTitle: "تغيير MFA لمالك النظام",
    reauthHelp:
      "أكد كلمة المرور الحالية والرمز الحالي من تطبيق المصادقة. سيُلغي BIO-EMS مفتاح MFA القديم وجميع جلسات المالك ثم ينشئ تسجيلًا جديدًا.",
    currentPassword: "كلمة المرور الحالية",
    currentCode: "رمز المصادقة الحالي",
    continue: "إنشاء تسجيل MFA جديد",
    working: "جارٍ التنفيذ…",
    cancel: "إلغاء",
    enrollmentHelp:
      "امسح رمز QR الجديد بتطبيق المصادقة ثم أدخل الرمز الجديد المكوّن من 6 أرقام. احذف الإدخال القديم لـ BIO-EMS من تطبيق المصادقة بعد تأكيد المفتاح الجديد.",
    setupKey: "مفتاح إعداد المصادقة الجديد",
    newCode: "رمز المصادقة الجديد",
    activate: "تفعيل MFA الجديد",
    activating: "جارٍ التفعيل…",
    failed: "فشل تغيير MFA. راجع كلمة المرور والرمز الحالي ثم حاول مرة أخرى.",
    confirmFailed:
      "تم رفض الرمز الجديد. استخدم الرمز الحالي الناتج من تسجيل QR الجديد.",
    success:
      "تم تغيير MFA. لم تعد جلسات المالك السابقة أو مفتاح MFA القديم صالحة.",
  },
} as const;

interface ResetEnrollment {
  token: string;
  secret: string;
  otpauthUri: string;
}

export function SystemOwnerConsolePage() {
  const { language } = useLocalization();
  const { principal, logout, apiClient } = usePlatformAuthentication();
  const text = copy[language];
  const [resetOpen, setResetOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [resetPending, setResetPending] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const [resetFailed, setResetFailed] = useState(false);
  const [confirmFailed, setConfirmFailed] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [enrollment, setEnrollment] = useState<ResetEnrollment>();
  const [qrCode, setQrCode] = useState<string>();

  useEffect(() => {
    let active = true;
    if (!enrollment) {
      return () => {
        active = false;
      };
    }

    void QRCode.toDataURL(enrollment.otpauthUri, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 220,
    })
      .then((url) => {
        if (active) setQrCode(url);
      })
      .catch(() => {
        if (active) setQrCode(undefined);
      });

    return () => {
      active = false;
    };
  }, [enrollment]);

  const closeReset = () => {
    if (resetPending || confirmPending) return;
    setResetOpen(false);
    setCurrentPassword("");
    setCurrentCode("");
    setNewCode("");
    setResetFailed(false);
    setConfirmFailed(false);
    setCompleted(false);
    setEnrollment(undefined);
    setQrCode(undefined);
  };

  const beginReset = async (event: FormEvent) => {
    event.preventDefault();
    setResetFailed(false);
    setConfirmFailed(false);
    setResetPending(true);
    try {
      const raw = await apiClient.request<unknown>("/platform-auth/mfa/reset", {
        method: "POST",
        auth: "protected",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          current_code: currentCode,
        }),
      });
      const response = ownerMfaResetResponseSchema.parse(raw);
      setEnrollment({
        token: response.enrollment_token,
        secret: response.secret,
        otpauthUri: response.otpauth_uri,
      });
      setCurrentPassword("");
      setCurrentCode("");
      setNewCode("");
    } catch {
      setResetFailed(true);
    } finally {
      setResetPending(false);
    }
  };

  const confirmReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!enrollment) return;
    setConfirmFailed(false);
    setConfirmPending(true);
    try {
      await apiClient.request("/platform-auth/mfa/enrollment/confirm", {
        method: "POST",
        auth: "public",
        bearerToken: enrollment.token,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: newCode }),
      });
      setCompleted(true);
      setEnrollment(undefined);
      setNewCode("");
      logout();
    } catch {
      setConfirmFailed(true);
    } finally {
      setConfirmPending(false);
    }
  };

  return (
    <Box component="main" sx={{ minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar sx={{ gap: 2, py: 1 }}>
          <Box
            sx={{
              bgcolor: "rgba(255,255,255,0.96)",
              borderRadius: 2,
              boxShadow: "0 4px 18px rgba(0,0,0,0.24)",
              flexShrink: 0,
              px: 1.5,
              py: 0.75,
            }}
          >
            <BrandLogo sx={{ height: 38, width: { xs: 118, sm: 168 } }} />
          </Box>
          <Box sx={{ flexGrow: 1 }}>
            <Typography component="h1" variant="h6">
              {text.title}
            </Typography>
            <Typography variant="caption">{text.subtitle}</Typography>
          </Box>
          <Box
            sx={{
              alignItems: "flex-end",
              flexDirection: "column",
              display: { xs: "none", sm: "flex" },
              marginInlineEnd: 2,
            }}
          >
            <Typography variant="caption">{text.signedIn}</Typography>
            <Typography variant="body2">{principal?.username}</Typography>
          </Box>
          <Button color="inherit" onClick={logout}>
            {text.logout}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {text.foundation}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          }}
        >
          {text.modules.map((module) => (
            <Card
              key={module.key}
              variant="outlined"
              sx={{
                borderInlineStart: 4,
                borderInlineStartColor: "primary.main",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <CardContent>
                <Typography component="h2" variant="h6">
                  {module.label}
                </Typography>
              </CardContent>
              <CardActions sx={{ mt: "auto" }}>
                <Button component={Link} to={`/system-owner/${module.key}`}>
                  {text.open}
                </Button>
              </CardActions>
            </Card>
          ))}
          <Card
            variant="outlined"
            sx={{
              borderInlineStart: 4,
              borderInlineStartColor: "warning.main",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <CardContent>
              <Typography component="h2" variant="h6">
                {text.mfaTitle}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {text.mfaDescription}
              </Typography>
            </CardContent>
            <CardActions sx={{ mt: "auto" }}>
              <Button
                color="warning"
                onClick={() => {
                  setResetOpen(true);
                  setCompleted(false);
                }}
              >
                {text.rotate}
              </Button>
            </CardActions>
          </Card>
        </Box>
      </Container>

      <Dialog fullWidth maxWidth="sm" onClose={closeReset} open={resetOpen}>
        <DialogTitle>{text.dialogTitle}</DialogTitle>
        <DialogContent>
          {completed ? (
            <Alert severity="success" sx={{ mt: 1 }}>
              {text.success}
            </Alert>
          ) : enrollment ? (
            <Stack
              component="form"
              id="owner-mfa-confirm-form"
              onSubmit={(event) => void confirmReset(event)}
              spacing={2}
              sx={{ mt: 1 }}
            >
              <Alert severity="warning">{text.enrollmentHelp}</Alert>
              {confirmFailed ? (
                <Alert severity="error">{text.confirmFailed}</Alert>
              ) : null}
              {qrCode ? (
                <Box
                  alt="New System Owner authenticator enrollment QR code"
                  component="img"
                  src={qrCode}
                  sx={{ display: "block", height: 220, mx: "auto", width: 220 }}
                />
              ) : null}
              <Typography color="text.secondary" variant="caption">
                {text.setupKey}
              </Typography>
              <Typography
                component="code"
                sx={{ overflowWrap: "anywhere", userSelect: "all" }}
              >
                {enrollment.secret}
              </Typography>
              <TextField
                autoComplete="one-time-code"
                label={text.newCode}
                onChange={(event) =>
                  setNewCode(event.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 6,
                    pattern: "[0-9]{6}",
                  },
                }}
                value={newCode}
              />
            </Stack>
          ) : (
            <Stack
              component="form"
              id="owner-mfa-reset-form"
              onSubmit={(event) => void beginReset(event)}
              spacing={2}
              sx={{ mt: 1 }}
            >
              <Alert severity="warning">{text.reauthHelp}</Alert>
              {resetFailed ? (
                <Alert severity="error">{text.failed}</Alert>
              ) : null}
              <TextField
                autoComplete="current-password"
                label={text.currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                required
                type="password"
                value={currentPassword}
              />
              <TextField
                autoComplete="one-time-code"
                label={text.currentCode}
                onChange={(event) =>
                  setCurrentCode(
                    event.target.value.replace(/\D/g, "").slice(0, 6),
                  )
                }
                required
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 6,
                    pattern: "[0-9]{6}",
                  },
                }}
                value={currentCode}
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button
            disabled={resetPending || confirmPending}
            onClick={closeReset}
          >
            {text.cancel}
          </Button>
          {!completed ? (
            <Button
              disabled={
                enrollment
                  ? confirmPending || newCode.length !== 6
                  : resetPending ||
                    currentCode.length !== 6 ||
                    currentPassword.length === 0
              }
              form={
                enrollment ? "owner-mfa-confirm-form" : "owner-mfa-reset-form"
              }
              type="submit"
              variant="contained"
            >
              {enrollment
                ? confirmPending
                  ? text.activating
                  : text.activate
                : resetPending
                  ? text.working
                  : text.continue}
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>
    </Box>
  );
}
