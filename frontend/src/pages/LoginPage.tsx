import {
  Alert,
  Box,
  Button,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { useRef, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  AuthenticationFailure,
  type AuthenticationFailureKind,
} from "../auth/AuthenticationContext";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";

export function LoginPage() {
  const { resources } = useLocalization();
  const { login, loginPending } = useAuthentication();
  const navigate = useNavigate();
  const errorRef = useRef<HTMLDivElement>(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failure, setFailure] = useState<AuthenticationFailureKind>();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailure(undefined);
    try {
      await login({ username, password });
      setPassword("");
      void navigate("/", { replace: true });
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
        <Typography component="h1" gutterBottom variant="h4">
          {resources.authentication.loginTitle}
        </Typography>
        {failure ? (
          <Alert ref={errorRef} severity="error" sx={{ mb: 2 }} tabIndex={-1}>
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
