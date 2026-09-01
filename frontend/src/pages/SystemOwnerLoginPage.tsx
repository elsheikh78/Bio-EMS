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
import { usePlatformAuthentication } from "../platform-auth/PlatformAuthenticationProvider";

const copy = {
  en: {
    title: "BIO-EMS System Owner",
    description: "Restricted platform operations access.",
    username: "Owner username",
    password: "Password",
    signIn: "Sign in",
    signingIn: "Signing in…",
    error: "System Owner authentication failed.",
  },
  ar: {
    title: "مالك نظام BIO-EMS",
    description: "دخول مقيد لعمليات إدارة المنصة.",
    username: "اسم مستخدم مالك النظام",
    password: "كلمة المرور",
    signIn: "تسجيل الدخول",
    signingIn: "جارٍ تسجيل الدخول…",
    error: "فشل تسجيل دخول مالك النظام.",
  },
} as const;

export function SystemOwnerLoginPage() {
  const { language } = useLocalization();
  const { login, loginPending } = usePlatformAuthentication();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [failed, setFailed] = useState(false);
  const text = copy[language];

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setFailed(false);
    try {
      await login({ username, password });
    } catch {
      setFailed(true);
    }
  };

  return (
    <Box
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center", p: 2 }}
    >
      <Paper
        component="form"
        onSubmit={submit}
        sx={{ maxWidth: 440, p: 4, width: "100%" }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography component="h1" variant="h4">
              {text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {text.description}
            </Typography>
          </Box>
          {failed ? <Alert severity="error">{text.error}</Alert> : null}
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
          <Button disabled={loginPending} type="submit" variant="contained">
            {loginPending ? text.signingIn : text.signIn}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
