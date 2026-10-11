import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInitialFocus } from "../accessibility/useInitialFocus";
import { apiRequest } from "../api/client";
import {
  AuthenticationFailure,
  type AuthenticationFailureKind,
} from "../auth/AuthenticationContext";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
import { resolveSafeReturnPath } from "../routing/routePolicy";

import { AdminOfflineRecovery } from "./AdminOfflineRecovery";

const recoveryCopy = {
  en: {
    forgot: "Forgot password?",
    title: "Password recovery",
    help: "Operator and Viewer: enter your username to request a reset from your customer administrator. ADMIN: contact the company that supplied BIO-EMS; only System Owner can reset your password.",
    admin: "I am a customer ADMIN",
    user: "I am an Operator or Viewer",
    adminHelp:
      "Contact the company that supplied BIO-EMS and provide your customer/site name and username. After verifying your identity, System Owner opens Customer ADMIN management, selects your customer and account, and resets the password. You can also export a recovery request below and import the company-signed permit. No automatic email or WhatsApp link is sent.",
    submit: "Request password reset",
    pending: "Submitting…",
    success:
      "If this is an eligible Operator or Viewer account, a recovery request has been recorded for your customer administrator. ADMIN accounts must contact the company for a System Owner reset.",
    error: "The recovery request could not be submitted. Try again.",
    back: "Back to sign in",
  },
  ar: {
    forgot: "نسيت كلمة المرور؟",
    title: "استعادة كلمة المرور",
    help: "Operator وViewer: أدخل اسم المستخدم لطلب إعادة التعيين من مسؤول العميل. Admin: تواصل مع الشركة الموردة لـBIO-EMS؛ مالك النظام فقط يمكنه إعادة تعيين كلمة مرورك.",
    admin: "أنا Admin لدى العميل",
    user: "أنا Operator أو Viewer",
    adminHelp:
      "تواصل مع الشركة الموردة لـBIO-EMS وقدم اسم العميل والموقع واسم المستخدم. بعد التحقق من هويتك، يفتح مالك النظام إدارة حسابات Admin، ويختار العميل وحسابك، ويعيد تعيين كلمة المرور. يمكنك أيضًا تصدير طلب الاستعادة أدناه واستيراد التصريح الموقّع من الشركة. لا يُرسل رابط تلقائي عبر البريد أو WhatsApp.",
    submit: "طلب إعادة تعيين كلمة المرور",
    pending: "جارٍ الإرسال…",
    success:
      "إذا كان الحساب Operator أو Viewer مؤهلاً، فقد تم تسجيل طلب الاستعادة لمسؤول العميل. حسابات Admin تتواصل مع الشركة لإعادة التعيين بواسطة مالك النظام.",
    error: "تعذر إرسال طلب الاستعادة. حاول مرة أخرى.",
    back: "العودة لتسجيل الدخول",
  },
} as const;

export function LoginPage() {
  const { resources, language } = useLocalization();
  const { login, loginPending } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const errorRef = useRef<HTMLDivElement>(null);
  const headingRef = useInitialFocus<HTMLHeadingElement>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<AuthenticationFailureKind>();
  const [recovering, setRecovering] = useState(false);
  const [adminRecovery, setAdminRecovery] = useState(false);
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<"success" | "error">();
  const recovery = recoveryCopy[language];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (recovering) {
      if (adminRecovery) return;
      setRecoveryPending(true);
      setRecoveryResult(undefined);
      try {
        await apiRequest("/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        });
        setRecoveryResult("success");
      } catch {
        setRecoveryResult("error");
      } finally {
        setRecoveryPending(false);
      }
      return;
    }

    setFailure(undefined);
    try {
      const authenticatedUser = await login({ username, password });
      setPassword("");
      void navigate(
        resolveSafeReturnPath(location.state, authenticatedUser.role),
        {
          replace: true,
          state: { focusAfterLogin: true },
        },
      );
    } catch (error) {
      setPassword("");
      setFailure(
        error instanceof AuthenticationFailure
          ? error.kind
          : "malformed-response",
      );
      window.requestAnimationFrame(() => errorRef.current?.focus());
    }
  };

  return (
    <Box
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center", p: 2 }}
    >
      <Box
        component="form"
        onSubmit={(event) => void submit(event)}
        sx={{ maxWidth: 420, width: "100%" }}
      >
        <Typography
          component="h1"
          gutterBottom
          ref={headingRef}
          tabIndex={-1}
          variant="h4"
        >
          {recovering ? recovery.title : resources.authentication.loginTitle}
        </Typography>
        {recovering ? (
          <>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {recovery.help}
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2 }}>
              <Button
                type="button"
                aria-pressed={adminRecovery}
                disabled={recoveryPending}
                onClick={() => {
                  setAdminRecovery(true);
                  setRecoveryResult(undefined);
                }}
              >
                {recovery.admin}
              </Button>
              <Button
                type="button"
                aria-pressed={!adminRecovery}
                disabled={recoveryPending}
                onClick={() => {
                  setAdminRecovery(false);
                  setRecoveryResult(undefined);
                }}
              >
                {recovery.user}
              </Button>
            </Box>
            {adminRecovery && (
              <>
                <Alert severity="info">{recovery.adminHelp}</Alert>
                <AdminOfflineRecovery language={language} />
              </>
            )}
          </>
        ) : null}
        {failure && !recovering ? (
          <Alert
            id="login-error"
            ref={errorRef}
            severity="error"
            sx={{ mb: 2 }}
            tabIndex={-1}
          >
            {resources.authentication.errors[failure]}
          </Alert>
        ) : null}
        {recoveryResult ? (
          <Alert
            severity={recoveryResult === "success" ? "success" : "error"}
            sx={{ mb: 2 }}
          >
            {recoveryResult === "success" ? recovery.success : recovery.error}
          </Alert>
        ) : null}
        {!(recovering && adminRecovery) && (
          <TextField
            autoComplete="username"
            disabled={loginPending || recoveryPending}
            fullWidth
            label={resources.authentication.username}
            margin="normal"
            name="username"
            onChange={(event) => setUsername(event.target.value)}
            required
            slotProps={{
              htmlInput: {
                "aria-describedby":
                  failure && !recovering ? "login-error" : undefined,
                "aria-invalid": failure && !recovering ? true : undefined,
              },
            }}
            value={username}
          />
        )}
        {!recovering ? (
          <TextField
            autoComplete="current-password"
            disabled={loginPending}
            fullWidth
            label={resources.authentication.password}
            margin="normal"
            name="password"
            onChange={(event) => setPassword(event.target.value)}
            required
            slotProps={{
              htmlInput: {
                "aria-describedby": failure ? "login-error" : undefined,
                "aria-invalid": failure ? true : undefined,
              },
            }}
            type="password"
            value={password}
          />
        ) : null}
        {!(recovering && adminRecovery) && (
          <Button
            disabled={loginPending || recoveryPending}
            fullWidth
            sx={{ mt: 2, minHeight: 44 }}
            type="submit"
            variant="contained"
          >
            {recovering ? (
              recoveryPending ? (
                recovery.pending
              ) : (
                recovery.submit
              )
            ) : loginPending ? (
              <>
                <CircularProgress aria-hidden size={20} sx={{ mr: 1 }} />
                {resources.authentication.signingIn}
              </>
            ) : (
              resources.authentication.signIn
            )}
          </Button>
        )}
        <Button
          disabled={loginPending || recoveryPending}
          fullWidth
          onClick={() => {
            setRecovering((value) => !value);
            setAdminRecovery(false);
            setFailure(undefined);
            setRecoveryResult(undefined);
            setPassword("");
          }}
          sx={{ mt: 1 }}
          type="button"
          variant="text"
        >
          {recovering ? recovery.back : recovery.forgot}
        </Button>
      </Box>
    </Box>
  );
}
