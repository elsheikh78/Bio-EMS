import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useState } from "react";
import type { PasswordRecoveryRequest } from "./contracts";
import {
  PASSWORD_REQUIREMENTS_TEXT,
  evaluatePasswordPolicy,
} from "./passwordPolicy";
import {
  usePasswordRecoveryRequests,
  useResetPasswordRecoveryRequest,
} from "./queries";
import { ApiResponseError } from "../api/client";
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";

export function PasswordRecoveryPanel() {
  const { language } = useLocalization();
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const requests = usePasswordRecoveryRequests();
  const [selected, setSelected] = useState<PasswordRecoveryRequest>();

  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h5">
            {t("Password recovery requests", "طلبات استعادة كلمة المرور")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Pending customer-user requests. Resetting creates a new password and requires the user to change it after sign-in.",
              "طلبات المستخدمين المعلقة. إعادة التعيين تنشئ كلمة مرور جديدة وتُلزم المستخدم بتغييرها بعد تسجيل الدخول.",
            )}
          </Typography>
        </Box>

        {requests.isPending ? (
          <CircularProgress
            aria-label={t("Loading recovery requests", "جارٍ تحميل طلبات الاستعادة")}
          />
        ) : null}
        {requests.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void requests.refetch()}>
                {t("Retry", "إعادة المحاولة")}
              </Button>
            }
          >
            {t(
              "Unable to load password recovery requests.",
              "تعذر تحميل طلبات استعادة كلمة المرور.",
            )}
          </Alert>
        ) : null}
        {!requests.isPending && !requests.isError && requests.data?.length === 0 ? (
          <Alert severity="info">
            {t("No pending recovery requests.", "لا توجد طلبات استعادة معلقة.")}
          </Alert>
        ) : null}

        {requests.data?.map((request) => (
          <Box
            key={request.request_id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box>
              <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                <Typography component="h3" variant="h6">
                  {request.username_hint ?? t("Unknown user", "مستخدم غير معروف")}
                </Typography>
                <Chip size="small" label={t("Pending", "معلق")} color="warning" />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("Requested", "تاريخ الطلب")}: {new Date(request.requested_at).toLocaleString()}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t("Expires", "ينتهي")}: {new Date(request.expires_at).toLocaleString()}
              </Typography>
            </Box>
            <Button variant="outlined" onClick={() => setSelected(request)}>
              {t("Reset password", "إعادة تعيين كلمة المرور")}
            </Button>
          </Box>
        ))}
      </Stack>

      {selected ? (
        <RecoveryResetDialog
          request={selected}
          language={language}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </Paper>
  );
}

function RecoveryResetDialog({
  request,
  language,
  onClose,
}: {
  request: PasswordRecoveryRequest;
  language: "en" | "ar";
  onClose: () => void;
}) {
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const mutation = useResetPasswordRecoveryRequest();
  const [password, setPassword] = useState("");
  const policy = evaluatePasswordPolicy(password);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!policy.isValid) return;
    try {
      await mutation.mutateAsync({ requestId: request.request_id, password });
      onClose();
    } catch {
      // Mutation state renders the error without exposing credentials.
    }
  }

  return (
    <Dialog open fullWidth onClose={mutation.isPending ? undefined : onClose}>
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>
          {t("Reset password for", "إعادة تعيين كلمة المرور للمستخدم")}{" "}
          {request.username_hint ?? t("user", "المستخدم")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              {t(
                "The new password is never displayed or returned by BIO-EMS. The user must change it after the next sign-in.",
                "لا يعرض BIO-EMS كلمة المرور الجديدة ولا يعيدها. ويجب على المستخدم تغييرها بعد تسجيل الدخول التالي.",
              )}
            </Alert>
            {mutation.isError ? (
              <Alert severity="error">
                {recoveryErrorMessage(mutation.error, language)}
              </Alert>
            ) : null}
            <TextField
              required
              type="password"
              label={t("Temporary password", "كلمة المرور المؤقتة")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              helperText={
                language === "ar"
                  ? "12 حرفًا على الأقل وتحتوي على أحرف كبيرة وصغيرة ورقم ورمز."
                  : PASSWORD_REQUIREMENTS_TEXT
              }
              error={password.length > 0 && !policy.isValid}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !policy.isValid}
          >
            {t("Reset password", "إعادة تعيين كلمة المرور")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function recoveryErrorMessage(error: unknown, language: "en" | "ar") {
  const ar = language === "ar";
  if (!(error instanceof ApiResponseError)) {
    return ar ? "تعذر إعادة تعيين كلمة المرور." : "Password could not be reset.";
  }
  switch (error.code) {
    case "PASSWORD_RECOVERY_REQUEST_NOT_FOUND":
    case "PASSWORD_RECOVERY_REQUEST_INACTIVE":
      return ar
        ? "لم يعد طلب الاستعادة نشطًا. حدّث القائمة وحاول مرة أخرى."
        : "The recovery request is no longer active. Refresh the list and try again.";
    case "USER_NOT_ACTIVE":
      return ar
        ? "حساب المستخدم غير نشط ولا يمكن إعادة تعيين كلمة مروره من هذا الطلب."
        : "The user account is not active and cannot be reset from this request.";
    case "ADMIN_MANAGED_BY_SYSTEM_OWNER":
      return ar
        ? "حسابات المدير تتم إدارتها من خلال SYSTEM_OWNER."
        : "Administrator accounts are managed through SYSTEM_OWNER.";
    case "VALIDATION_ERROR":
      return ar
        ? "كلمة المرور لا تطابق سياسة كلمة المرور المطلوبة."
        : "The password does not meet the required password policy.";
    default:
      return ar ? "تعذر إعادة تعيين كلمة المرور." : "Password could not be reset.";
  }
}
