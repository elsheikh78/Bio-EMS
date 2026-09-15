import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
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
    secret: "Authenticator setup key",
    verify: "Activate MFA",
    verifying: "Activating…",
    activated: "MFA is active. Sign in again using your authenticator code.",
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
    secret: "مفتاح إعداد تطبيق المصادقة",
    verify: "تفعيل المصادقة الثنائية",
    verifying: "جارٍ التفعيل…",
    activated:
      "تم تفعيل المصادقة الثنائية. سجّل الدخول مجددًا باستخدام رمز التطبيق.",
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
  const text = copy[language];
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    setActivated(false);
    try {
      if (enrollment) {
        setSetupPending(true);
        await apiClient.request("/platform-auth/mfa/enrollment/confirm", {
          method: "POST",
          auth: "public",
          headers: {
            Authorization: `Bearer ${enrollment.token}`,
            "Content-Type": "application/json",
          },
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
        onSubmit={(event) => {
          void submit(event);
        }}
        sx={{ maxWidth: 440, p: 4, width: "100%" }}
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
              {enrollment ? text.setupTitle : text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {enrollment ? text.setupHelp : text.description}
            </Typography>
          </Box>
          {failed ? <Alert severity="error">{text.error}</Alert> : null}
          {activated ? (
            <Alert severity="success">{text.activated}</Alert>
          ) : null}
          {enrollment ? (
            <Box>
              <Typography color="text.secondary" variant="caption">
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
                onChange={(event) => setUsername(event.target.value)}
                required
                value={username}
              />
              <TextField
                autoComplete="current-password"
                label={text.password}
                onChange={(event) => setPassword(event.target.value)}
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
            onChange={(event) =>
              setCode(event.target.value.replace(/\D/g, "").slice(0, 6))
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
        </Stack>
      </Paper>
    </Box>
  );
}
