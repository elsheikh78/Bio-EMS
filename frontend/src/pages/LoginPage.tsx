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

const recoveryCopy = {
  en: {
    forgot: "Forgot password?",
    title: "Password recovery",
    help: "Enter your username. If the account is eligible, an administrator can continue the reset process. For security, the response does not reveal whether an account exists.",
    submit: "Request password reset",
    pending: "Submitting…",
    success:
      "If the account is eligible, the password recovery request has been recorded.",
    error: "The recovery request could not be submitted. Try again.",
    back: "Back to sign in",
  },
  ar: {
    forgot: "نسيت كلمة المرور؟",
    title: "استعادة كلمة المرور",
    help: "أدخل اسم المستخدم. إذا كان الحساب مؤهلاً، يستطيع المسؤول استكمال إعادة التعيين. لأسباب أمنية لا يكشف الرد ما إذا كان الحساب موجوداً.",
    submit: "طلب إعادة تعيين كلمة المرور",
    pending: "جارٍ الإرسال…",
    success: "إذا كان الحساب مؤهلاً، فقد تم تسجيل طلب استعادة كلمة المرور.",
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
  const [recoveryPending, setRecoveryPending] = useState(false);
  const [recoveryResult, setRecoveryResult] = useState<"success" | "error">();
  const recovery = recoveryCopy[language];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (recovering) {
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
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {recovery.help}
          </Typography>
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
        <Button
          disabled={loginPending || recoveryPending}
          fullWidth
          onClick={() => {
            setRecovering((value) => !value);
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
