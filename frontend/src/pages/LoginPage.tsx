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
import {
  AuthenticationFailure,
  type AuthenticationFailureKind,
} from "../auth/AuthenticationContext";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
import { resolveSafeReturnPath } from "../routing/routePolicy";

export function LoginPage() {
  const { resources } = useLocalization();
  const { login, loginPending } = useAuthentication();
  const navigate = useNavigate();
  const location = useLocation();
  const errorRef = useRef<HTMLDivElement>(null);
  const headingRef = useInitialFocus<HTMLHeadingElement>();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<AuthenticationFailureKind>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
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
          {resources.authentication.loginTitle}
        </Typography>
        {failure ? (
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
        <TextField
          autoComplete="username"
          disabled={loginPending}
          fullWidth
          label={resources.authentication.username}
          margin="normal"
          name="username"
          onChange={(event) => setUsername(event.target.value)}
          required
          slotProps={{
            htmlInput: {
              "aria-describedby": failure ? "login-error" : undefined,
              "aria-invalid": failure ? true : undefined,
            },
          }}
          value={username}
        />
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
        <Button
          disabled={loginPending}
          fullWidth
          sx={{ mt: 2, minHeight: 44 }}
          type="submit"
          variant="contained"
        >
          {loginPending ? (
            <>
              <CircularProgress aria-hidden size={20} sx={{ mr: 1 }} />
              {resources.authentication.signingIn}
            </>
          ) : (
            resources.authentication.signIn
          )}
        </Button>
      </Box>
    </Box>
  );
}
