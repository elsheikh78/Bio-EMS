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
import {
  filterAlarms,
  summarizeAlarms,
  type AlarmView,
} from "../alarms/presentation";
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
  const [view, setView] = useState<AlarmView>("ACTIVE");
  const records = alarms.data ?? [];
  const visible = filterAlarms(records, view);
  const summary = summarizeAlarms(records);
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
      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {[
          [t("Active", "النشطة"), summary.active, "error.main"],
          [t("Critical", "الحرجة"), summary.critical, "error.dark"],
          [
            t("Acknowledged", "تم الإقرار"),
            summary.acknowledged,
            "warning.main",
          ],
          [t("Recovered", "عادت طبيعية"), summary.recovered, "success.main"],
        ].map(([label, value, color]) => (
          <Paper
            key={String(label)}
            variant="outlined"
            sx={{ borderInlineStart: 5, borderInlineStartColor: color, p: 2 }}
          >
            <Typography color="text.secondary" variant="body2">
              {label}
            </Typography>
            <Typography
              variant="h4"
              sx={{
                color,
                fontWeight: 800,
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {value}
            </Typography>
          </Paper>
        ))}
      </Box>
      <Paper
        variant="outlined"
        sx={{
          alignItems: { xs: "stretch", sm: "center" },
          bgcolor: "action.hover",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          gap: 1,
          justifyContent: "space-between",
          p: 2,
        }}
      >
        <Stack direction="row" spacing={1}>
          <Button
            variant={view === "ACTIVE" ? "contained" : "outlined"}
            onClick={() => setView("ACTIVE")}
          >
            {t("Active", "النشطة")}
          </Button>
          <Button
            variant={view === "HISTORY" ? "contained" : "outlined"}
            onClick={() => setView("HISTORY")}
          >
            {t("History", "السجل")}
          </Button>
        </Stack>
        <Button
          variant="outlined"
          disabled={alarms.isFetching}
          onClick={() => void alarms.refetch()}
        >
          {t("Refresh", "تحديث")}
        </Button>
      </Paper>
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
              borderInlineStart: 5,
              borderInlineStartColor:
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
