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
import { useAuthentication } from "../auth/useAuthentication";
import { BrandLogo } from "../components/BrandLogo";
import { useLocalization } from "../localization/useLocalization";

const copy = {
  en: {
    title: "Change your password",
    help: "Your administrator reset this account. Create your own password before continuing to BIO-EMS.",
    current: "Temporary password",
    next: "New password",
    confirm: "Confirm new password",
    rule: "Use at least 12 characters with uppercase, lowercase and a number.",
    mismatch: "The new passwords do not match.",
    failed:
      "Password change failed. Check the temporary password and password requirements.",
    submit: "Change password and continue",
    pending: "Changing password…",
  },
  ar: {
    title: "تغيير كلمة المرور",
    help: "قام المسؤول بإعادة تعيين هذا الحساب. أنشئ كلمة المرور الخاصة بك قبل متابعة استخدام BIO-EMS.",
    current: "كلمة المرور المؤقتة",
    next: "كلمة المرور الجديدة",
    confirm: "تأكيد كلمة المرور الجديدة",
    rule: "استخدم 12 حرفًا على الأقل وتضمّن حرفًا كبيرًا وحرفًا صغيرًا ورقمًا.",
    mismatch: "كلمتا المرور الجديدتان غير متطابقتين.",
    failed:
      "فشل تغيير كلمة المرور. تحقق من كلمة المرور المؤقتة ومتطلبات كلمة المرور الجديدة.",
    submit: "تغيير كلمة المرور والمتابعة",
    pending: "جارٍ تغيير كلمة المرور…",
  },
} as const;

export function ForcedPasswordChangePage() {
  const { language } = useLocalization();
  const auth = useAuthentication();
  const text = copy[language];
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<"mismatch" | "failed">();

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(undefined);
    if (newPassword !== confirm) {
      setError("mismatch");
      return;
    }
    if (!auth.completePasswordChange) {
      setError("failed");
      return;
    }
    setPending(true);
    try {
      await auth.completePasswordChange(currentPassword, newPassword);
      setCurrentPassword("");
      setNewPassword("");
      setConfirm("");
    } catch {
      setError("failed");
    } finally {
      setPending(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center", p: 2 }}
    >
      <Paper
        component="form"
        onSubmit={(event) => void submit(event)}
        sx={{ maxWidth: 460, p: 4, width: "100%" }}
      >
        <Stack spacing={2}>
          <BrandLogo sx={{ maxWidth: 220 }} />
          <Box>
            <Typography component="h1" variant="h4">
              {text.title}
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              {text.help}
            </Typography>
          </Box>
          {error ? (
            <Alert severity="error">
              {error === "mismatch" ? text.mismatch : text.failed}
            </Alert>
          ) : null}
          <TextField
            autoComplete="current-password"
            label={text.current}
            onChange={(event) => setCurrentPassword(event.target.value)}
            required
            type="password"
            value={currentPassword}
          />
          <TextField
            autoComplete="new-password"
            helperText={text.rule}
            label={text.next}
            onChange={(event) => setNewPassword(event.target.value)}
            required
            type="password"
            value={newPassword}
          />
          <TextField
            autoComplete="new-password"
            label={text.confirm}
            onChange={(event) => setConfirm(event.target.value)}
            required
            type="password"
            value={confirm}
          />
          <Button disabled={pending} type="submit" variant="contained">
            {pending ? text.pending : text.submit}
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
