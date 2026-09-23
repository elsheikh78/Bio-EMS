import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState, type FormEvent } from "react";
import QRCode from "qrcode";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { ownerMfaEnrollmentResponseSchema } from "../platform-auth/contracts";
import { BrandLogo } from "../components/BrandLogo";
import { useInitialFocus } from "../accessibility/useInitialFocus";

const copy = {
  en: {
    title: "BIO-EMS System Owner",
    description: "Restricted platform operations access.",
    username: "Owner username",
    password: "Password",
    code: "Authenticator code",
    codeHelp: "Enter the 6-digit code after MFA is activated.",
    signIn: "Sign in",
    signingIn: "Signing in…",
    error: "System Owner authentication failed.",
    setupTitle: "Secure your owner account",
    setupHelp:
      "Add this key to your authenticator app, then enter the first 6-digit code. This setup token cannot open the owner console.",
    qrHelp:
      "Scan this QR code with your authenticator app. If scanning is unavailable, enter the setup key below manually.",
    secret: "Authenticator setup key",
    verify: "Activate MFA",
    verifying: "Activating…",
    activated: "MFA is active. Sign in again using your authenticator code.",
    forgot: "Forgot password?",
    recoveryTitle: "System Owner password recovery",
    recoveryHelp:
      "System Owner recovery is manufacturer-controlled. Generate an installation-bound recovery request on this BIO-EMS computer, send only that request to the manufacturer, then import the signed recovery package returned by the manufacturer.",
    recoveryRequest: "1. Generate recovery request",
    recoveryIssue: "2. Manufacturer signs the request offline",
    recoveryImport:
      "3. Import the signed recovery package on this installation",
    recoverySecurity:
      "The manufacturer private key must never be copied to this computer, GitHub, CI, Setup, logs or screenshots. There is no master password or customer-admin override.",
    recoveryCommand:
      "Use the local BIO-EMS recovery utility supplied with the installation. The web page never asks for the manufacturer private key.",
    back: "Back to System Owner sign in",
  },
  ar: {
    title: "مالك نظام BIO-EMS",
    description: "دخول مقيد لعمليات إدارة المنصة.",
    username: "اسم مستخدم مالك النظام",
    password: "كلمة المرور",
    code: "رمز تطبيق المصادقة",
    codeHelp: "أدخل الرمز المكوّن من 6 أرقام بعد تفعيل المصادقة الثنائية.",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول…",
    error: "فشل تسجيل دخول مالك النظام.",
    setupTitle: "تأمين حساب مالك النظام",
    setupHelp:
      "أضف هذا المفتاح إلى تطبيق المصادقة ثم أدخل أول رمز مكوّن من 6 أرقام. تذكرة الإعداد لا تستطيع فتح لوحة المالك.",
    qrHelp:
      "امسح رمز QR بتطبيق المصادقة. إذا تعذر المسح، أدخل مفتاح الإعداد الموجود أدناه يدويًا.",
    secret: "مفتاح إعداد تطبيق المصادقة",
    verify: "تفعيل المصادقة الثنائية",
    verifying: "جارٍ التفعيل…",
    activated:
      "تم تفعيل المصادقة الثنائية. سجّل الدخول مجددًا باستخدام رمز التطبيق.",
    forgot: "نسيت كلمة المرور؟",
    recoveryTitle: "استعادة كلمة مرور مالك النظام",
    recoveryHelp:
      "استعادة حساب مالك النظام خاضعة لتحكم الشركة المصنّعة. أنشئ طلب استعادة مرتبطًا بهذه النسخة من BIO-EMS، وأرسل الطلب فقط إلى الشركة، ثم استورد حزمة الاستعادة الموقعة التي تعيدها الشركة.",
    recoveryRequest: "1. إنشاء طلب الاستعادة",
    recoveryIssue: "2. توقيع الطلب لدى الشركة دون اتصال بالمفتاح الخاص",
    recoveryImport: "3. استيراد حزمة الاستعادة الموقعة على نفس النسخة",
    recoverySecurity:
      "يُحظر نسخ المفتاح الخاص للشركة إلى هذا الجهاز أو GitHub أو CI أو Setup أو السجلات أو الصور. ولا توجد كلمة مرور رئيسية أو صلاحية للـADMIN لتجاوز ذلك.",
    recoveryCommand:
      "استخدم أداة BIO-EMS المحلية للاستعادة المرفقة مع التثبيت. واجهة الويب لا تطلب المفتاح الخاص للشركة مطلقًا.",
    back: "العودة لتسجيل دخول مالك النظام",
  },
} as const;

interface EnrollmentState {
  token: string;
  secret: string;
  otpauthUri: string;
}

export function SystemOwnerLoginPage() {
  const { language } = useLocalization();
  const { apiClient, login, loginPending } = usePlatformAuthentication();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [enrollment, setEnrollment] = useState<EnrollmentState>();
  const [setupPending, setSetupPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const [activated, setActivated] = useState(false);
  const [recovery, setRecovery] = useState(false);
  const [qrCode, setQrCode] = useState<string>();
  const text = copy[language];
  const headingRef = useInitialFocus<HTMLHeadingElement>();
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
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (recovery) return;
    setFailed(false);
    setActivated(false);
    try {
      if (enrollment) {
        setSetupPending(true);
        await apiClient.request("/platform-auth/mfa/enrollment/confirm", {
          method: "POST",
          auth: "public",
          bearerToken: enrollment.token,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });
        setEnrollment(undefined);
        setPassword("");
        setCode("");
        setActivated(true);
        return;
      }
      const response = await login({
        username,
        password,
        ...(code ? { code } : {}),
      });
      if ("mfa_enrollment_required" in response) {
        setSetupPending(true);
        const raw = await apiClient.request<unknown>(
          "/platform-auth/mfa/enrollment",
          {
            method: "POST",
            auth: "public",
            headers: { Authorization: `Bearer ${response.enrollment_token}` },
          },
        );
        const setup = ownerMfaEnrollmentResponseSchema.parse(raw);
        setEnrollment({
          token: response.enrollment_token,
          secret: setup.secret,
          otpauthUri: setup.otpauth_uri,
        });
        setCode("");
      }
    } catch {
      setFailed(true);
    } finally {
      setSetupPending(false);
    }
  };
  const pending = loginPending || setupPending;
  return (
    <Box
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center", p: 2 }}
    >
      <Paper
        component="form"
        onSubmit={(event) => void submit(event)}
        sx={{ maxWidth: recovery ? 560 : 440, p: 4, width: "100%" }}
      >
        <Stack spacing={2.5}>
          <BrandLogo sx={{ maxWidth: 220 }} />
          <Box>
            <Typography
              component="h1"
              ref={headingRef}
              tabIndex={-1}
              variant="h4"
            >
              {recovery
                ? text.recoveryTitle
                : enrollment
                  ? text.setupTitle
                  : text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {recovery
                ? text.recoveryHelp
                : enrollment
                  ? text.setupHelp
                  : text.description}
            </Typography>
          </Box>
          {recovery ? (
            <>
              <Alert severity="info">
                <Stack spacing={1}>
                  <Typography>{text.recoveryRequest}</Typography>
                  <Typography>{text.recoveryIssue}</Typography>
                  <Typography>{text.recoveryImport}</Typography>
                </Stack>
              </Alert>
              <Alert severity="warning">{text.recoverySecurity}</Alert>
              <Typography color="text.secondary">
                {text.recoveryCommand}
              </Typography>
              <Button
                onClick={() => setRecovery(false)}
                type="button"
                variant="outlined"
              >
                {text.back}
              </Button>
            </>
          ) : (
            <>
              {failed ? <Alert severity="error">{text.error}</Alert> : null}
              {activated ? (
                <Alert severity="success">{text.activated}</Alert>
              ) : null}
              {enrollment ? (
                <Box>
                  <Typography color="text.secondary" sx={{ mb: 1 }}>
                    {text.qrHelp}
                  </Typography>
                  {qrCode ? (
                    <Box
                      alt="Authenticator enrollment QR code"
                      component="img"
                      src={qrCode}
                      sx={{
                        display: "block",
                        height: 220,
                        maxWidth: "100%",
                        mx: "auto",
                        width: 220,
                      }}
                    />
                  ) : null}
                  <Typography
                    color="text.secondary"
                    sx={{ mt: 1 }}
                    variant="caption"
                  >
                    {text.secret}
                  </Typography>
                  <Typography
                    component="code"
                    sx={{
                      display: "block",
                      overflowWrap: "anywhere",
                      userSelect: "all",
                    }}
                  >
                    {enrollment.secret}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    component="code"
                    sx={{
                      display: "block",
                      fontSize: "0.7rem",
                      mt: 1,
                      overflowWrap: "anywhere",
                      userSelect: "all",
                    }}
                  >
                    {enrollment.otpauthUri}
                  </Typography>
                </Box>
              ) : (
                <>
                  <TextField
                    autoComplete="username"
                    label={text.username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    value={username}
                  />
                  <TextField
                    autoComplete="current-password"
                    label={text.password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    type="password"
                    value={password}
                  />
                </>
              )}
              <TextField
                autoComplete="one-time-code"
                helperText={text.codeHelp}
                label={text.code}
                onChange={(e) =>
                  setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                required={Boolean(enrollment)}
                slotProps={{
                  htmlInput: {
                    inputMode: "numeric",
                    maxLength: 6,
                    pattern: "[0-9]{6}",
                  },
                }}
                value={code}
              />
              <Button disabled={pending} type="submit" variant="contained">
                {enrollment
                  ? setupPending
                    ? text.verifying
                    : text.verify
                  : loginPending
                    ? text.signingIn
                    : text.signIn}
              </Button>
              {!enrollment ? (
                <Button
                  onClick={() => {
                    setRecovery(true);
                    setFailed(false);
                    setPassword("");
                    setCode("");
                  }}
                  type="button"
                  variant="text"
                >
                  {text.forgot}
                </Button>
              ) : null}
            </>
          )}
        </Stack>
      </Paper>
    </Box>
  );
}
