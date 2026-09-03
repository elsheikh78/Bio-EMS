import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAlarms, useAcknowledgeAlarm } from "../alarms/queries";
import { hasPermission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";

export function AlarmsPage() {
  const { language } = useLocalization();
  const t = (english: string, arabic: string) =>
    language === "ar" ? arabic : english;
  const alarms = useAlarms();
  const acknowledge = useAcknowledgeAlarm();
  const { user } = useAuthentication();
  const [activeOnly, setActiveOnly] = useState(true);
  const visible = (alarms.data ?? []).filter(
    (alarm) => !activeOnly || alarm.status === "TRIGGERED",
  );
  const canAcknowledge = Boolean(
    user && hasPermission(user.role, "ALARM_ACKNOWLEDGE"),
  );

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {t("Operational Alarm lifecycle", "دورة حياة الإنذارات التشغيلية")}
        </Typography>
        <Typography component="h1" variant="h4">
          {t("Alarms", "الإنذارات")}
        </Typography>
        <Typography color="text.secondary">
          {t(
            "Review current and historical Alarm evidence and acknowledge eligible active events.",
            "راجع أدلة الإنذارات الحالية والتاريخية وأقرّ بالأحداث النشطة المسموح بها.",
          )}
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          variant={activeOnly ? "contained" : "outlined"}
          onClick={() => setActiveOnly(true)}
        >
          {t("Active", "النشطة")}
        </Button>
        <Button
          variant={!activeOnly ? "contained" : "outlined"}
          onClick={() => setActiveOnly(false)}
        >
          {t("History", "السجل")}
        </Button>
        <Button onClick={() => void alarms.refetch()}>
          {t("Refresh", "تحديث")}
        </Button>
      </Stack>
      {alarms.isPending ? (
        <CircularProgress
          aria-label={t("Loading Alarms", "جارٍ تحميل الإنذارات")}
        />
      ) : null}
      {alarms.isError ? (
        <Alert
          severity="error"
          action={
            <Button onClick={() => void alarms.refetch()}>
              {t("Retry", "إعادة المحاولة")}
            </Button>
          }
        >
          {t("Unable to load Alarms.", "تعذر تحميل الإنذارات.")}
        </Alert>
      ) : null}
      {acknowledge.isError ? (
        <Alert severity="error">
          {t(
            "Alarm acknowledgement failed or the Alarm state changed.",
            "فشل الإقرار بالإنذار أو تغيرت حالته.",
          )}
        </Alert>
      ) : null}
      {!alarms.isPending && !alarms.isError && visible.length === 0 ? (
        <Alert severity="info">
          {t("No Alarms match this view.", "لا توجد إنذارات تطابق هذا العرض.")}
        </Alert>
      ) : null}
      <Stack spacing={2}>
        {visible.map((alarm) => (
          <Paper
            key={alarm.id}
            variant="outlined"
            sx={{
              p: 3,
              borderLeft: 5,
              borderLeftColor:
                alarm.severity === "CRITICAL"
                  ? "error.main"
                  : alarm.severity === "WARNING"
                    ? "warning.main"
                    : "info.main",
            }}
          >
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              sx={{ justifyContent: "space-between" }}
            >
              <Box>
                <Typography component="h2" variant="h6">
                  {alarm.type}
                </Typography>
                <Typography color="text.secondary">
                  {t("Sensor", "الحساس")} #{alarm.sensor_id} ·{" "}
                  {t("Trigger value", "قيمة التفعيل")} {alarm.trigger_value}
                </Typography>
                <Typography variant="body2">
                  {t("Triggered", "وقت التفعيل")}:{" "}
                  {alarm.trigger_time ??
                    alarm.created_at ??
                    t("Unavailable", "غير متاح")}
                </Typography>
              </Box>
              <Stack direction="row" spacing={1} sx={{ alignItems: "center" }}>
                <Chip
                  color={
                    alarm.severity === "CRITICAL"
                      ? "error"
                      : alarm.severity === "WARNING"
                        ? "warning"
                        : "info"
                  }
                  label={localizeAlarmValue(alarm.severity, language)}
                />
                <Chip
                  variant="outlined"
                  label={localizeAlarmValue(alarm.status, language)}
                />
                {alarm.status === "TRIGGERED" && canAcknowledge ? (
                  <Button
                    disabled={acknowledge.isPending}
                    onClick={() => acknowledge.mutate(alarm.id)}
                  >
                    {t("Acknowledge", "إقرار")}
                  </Button>
                ) : null}
              </Stack>
            </Stack>
          </Paper>
        ))}
      </Stack>
    </Stack>
  );
}

function localizeAlarmValue(value: string, language: "en" | "ar") {
  if (language === "en") return value;
  return (
    (
      {
        CRITICAL: "حرج",
        WARNING: "تحذير",
        INFO: "معلومات",
        TRIGGERED: "نشط",
        ACKNOWLEDGED: "تم الإقرار",
        RECOVERED: "عاد طبيعيًا",
      } as Record<string, string>
    )[value] ?? value
  );
}
