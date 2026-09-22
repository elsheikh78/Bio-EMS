import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useEffect, useState } from "react";
import { useLocalization } from "../localization/useLocalization";

interface BackupItem {
  backupId: string;
  createdAt: string;
  source: "MANUAL" | "AUTOMATIC";
  artifactCount: number;
  totalBytes: number;
  telemetryState: string;
  identity: { customerCode: string; siteCode: string };
}

interface BackupSchedule {
  enabled: boolean;
  intervalHours: 6 | 12 | 24 | 168;
  retentionCount: number;
  nextRunAt: string | null;
  lastStartedAt: string | null;
  lastCompletedAt: string | null;
  lastFailure: string | null;
}

interface RestoreJobStatus {
  jobId: string;
  state: "QUEUED" | "RUNNING" | "SUCCEEDED" | "FAILED";
  error?: string;
}

interface BackupListResponse {
  backups: BackupItem[];
  latestRestoreJob?: RestoreJobStatus | null;
}

interface Props {
  request: (path: string, options?: RequestInit) => Promise<unknown>;
  basePath: string;
  restoreJobsPath?: string;
  disasterRecovery?: boolean;
}

const intervalOptions = [6, 12, 24, 168] as const;

export function BackupRestorePanel({
  request,
  basePath,
  restoreJobsPath = basePath,
  disasterRecovery = false,
}: Props) {
  const { language } = useLocalization();
  const ar = language === "ar";
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [schedule, setSchedule] = useState<BackupSchedule | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();
  const restoreSessionKey = `bioems:active-restore-job:${restoreJobsPath}`;
  const [activeRestoreJobId, setActiveRestoreJobId] = useState<string | null>(
    () => window.sessionStorage.getItem(restoreSessionKey),
  );

  const load = useCallback(async () => {
    try {
      const [backupResponse, scheduleResponse] = (await Promise.all([
        request(basePath),
        request(`${basePath}/schedule`),
      ])) as [BackupListResponse, { schedule: BackupSchedule }];
      setBackups(backupResponse.backups);
      setSchedule(scheduleResponse.schedule);
      setError(undefined);
      const latest = backupResponse.latestRestoreJob;
      if (latest && (latest.state === "QUEUED" || latest.state === "RUNNING")) {
        window.sessionStorage.setItem(restoreSessionKey, latest.jobId);
        setActiveRestoreJobId(latest.jobId);
        setBusy(true);
        setMessage(
          ar
            ? "الاستعادة قيد التنفيذ؛ ستُحدّث الصفحة تلقائيًا."
            : "Restore is in progress; this page will update automatically.",
        );
      } else if (latest?.jobId === activeRestoreJobId) {
        window.sessionStorage.removeItem(restoreSessionKey);
        setActiveRestoreJobId(null);
        setBusy(false);
        if (latest.state === "SUCCEEDED") {
          setMessage(
            ar ? "اكتملت الاستعادة بنجاح." : "Restore completed successfully.",
          );
        } else if (latest.state === "FAILED") {
          setMessage(undefined);
          setError(
            latest.error ??
              (ar
                ? "فشلت الاستعادة وتمت حماية الحالة السابقة."
                : "Restore failed; the previous state was protected."),
          );
        }
      }
    } catch {
      if (!activeRestoreJobId) {
        setError(
          ar
            ? "تعذر تحميل بيانات النسخ الاحتياطي."
            : "Backup data could not be loaded.",
        );
      }
    }
  }, [activeRestoreJobId, ar, basePath, request, restoreSessionKey]);

  useEffect(() => {
    const initial = window.setTimeout(() => void load(), 0);
    const timer = window.setInterval(() => void load(), 15_000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [load]);

  useEffect(() => {
    if (!activeRestoreJobId) return;
    let cancelled = false;
    let attempts = 0;

    const poll = async () => {
      if (cancelled) return;
      attempts += 1;
      try {
        const result = (await request(
          `${restoreJobsPath}/restore-jobs/${activeRestoreJobId}`,
        )) as { restoreJob: RestoreJobStatus };
        const restoreJob = result.restoreJob;
        if (restoreJob.state === "QUEUED" || restoreJob.state === "RUNNING") {
          return;
        }
        window.sessionStorage.removeItem(restoreSessionKey);
        setActiveRestoreJobId(null);
        setBusy(false);
        if (restoreJob.state === "SUCCEEDED") {
          setError(undefined);
          setMessage(
            ar ? "اكتملت الاستعادة بنجاح." : "Restore completed successfully.",
          );
          await load();
        } else {
          setMessage(undefined);
          setError(
            restoreJob.error ??
              (ar
                ? "فشلت الاستعادة وتمت حماية الحالة السابقة."
                : "Restore failed; the previous state was protected."),
          );
        }
      } catch {
        try {
          const result = (await request(basePath)) as BackupListResponse;
          const latest = result.latestRestoreJob;
          if (latest?.jobId === activeRestoreJobId) {
            if (latest.state === "SUCCEEDED" || latest.state === "FAILED") {
              window.sessionStorage.removeItem(restoreSessionKey);
              setActiveRestoreJobId(null);
              setBusy(false);
              if (latest.state === "SUCCEEDED") {
                setError(undefined);
                setMessage(
                  ar
                    ? "اكتملت الاستعادة بنجاح."
                    : "Restore completed successfully.",
                );
                await load();
              } else {
                setMessage(undefined);
                setError(
                  latest.error ??
                    (ar
                      ? "فشلت الاستعادة وتمت حماية الحالة السابقة."
                      : "Restore failed; the previous state was protected."),
                );
              }
            }
          }
        } catch {
          // Controlled services are expected to be unavailable during restore.
        }
      } finally {
        if (!cancelled && attempts < 180) {
          window.setTimeout(() => void poll(), 2_000);
        } else if (!cancelled) {
          setBusy(false);
          setError(
            ar
              ? "انتهت مهلة متابعة الاستعادة. راجع حالة المهمة."
              : "Restore status timed out. Check the restore job status.",
          );
        }
      }
    };

    const initial = window.setTimeout(() => {
      if (cancelled) return;
      setBusy(true);
      setError(undefined);
      setMessage(
        ar
          ? "الاستعادة قيد التنفيذ؛ ستُحدّث الصفحة تلقائيًا."
          : "Restore is in progress; this page will update automatically.",
      );
      void poll();
    }, 0);
    return () => {
      cancelled = true;
      window.clearTimeout(initial);
    };
  }, [
    activeRestoreJobId,
    ar,
    basePath,
    load,
    request,
    restoreJobsPath,
    restoreSessionKey,
  ]);

  const act = async (operation: () => Promise<unknown>, success: string) => {
    setBusy(true);
    setError(undefined);
    setMessage(undefined);
    try {
      await operation();
      setMessage(success);
      await load();
    } catch {
      setError(
        ar ? "تعذر إكمال العملية." : "The operation could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  };

  const saveSchedule = () => {
    if (!schedule) return;
    void act(
      () =>
        request(`${basePath}/schedule`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            enabled: schedule.enabled,
            intervalHours: schedule.intervalHours,
            retentionCount: schedule.retentionCount,
          }),
        }),
      ar ? "تم حفظ جدول النسخ التلقائي." : "Automatic backup schedule saved.",
    );
  };

  const restore = (backupId: string, dr = false) => {
    const confirmation = dr
      ? window.prompt(
          ar
            ? "اكتب TRANSFER_INSTALLATION_IDENTITY لتأكيد استعادة الطوارئ ونقل هوية التثبيت."
            : "Type TRANSFER_INSTALLATION_IDENTITY to confirm disaster recovery identity transfer.",
        )
      : window.confirm(
          ar
            ? "سيتم إيقاف الخدمات مؤقتًا واستعادة هذه النسخة. هل تريد المتابعة؟"
            : "Services will stop temporarily while this backup is restored. Continue?",
        );
    if (
      (dr && confirmation !== "TRANSFER_INSTALLATION_IDENTITY") ||
      (!dr && !confirmation)
    )
      return;
    void (async () => {
      setBusy(true);
      setError(undefined);
      setMessage(
        ar ? "تم وضع الاستعادة في قائمة التنفيذ." : "Restore was queued.",
      );
      try {
        const response = (await request(
          `${basePath}/${backupId}/${dr ? "dr-restore" : "restore"}`,
          {
            method: "POST",
            headers: dr ? { "Content-Type": "application/json" } : undefined,
            body: dr ? JSON.stringify({ confirmation }) : undefined,
          },
        )) as { restoreJob: { jobId: string } };
        window.sessionStorage.setItem(
          restoreSessionKey,
          response.restoreJob.jobId,
        );
        setActiveRestoreJobId(response.restoreJob.jobId);
      } catch {
        setError(ar ? "تعذر بدء الاستعادة." : "Restore could not be started.");
        setBusy(false);
      }
    })();
  };

  const intervalLabel = (hours: number) => {
    if (hours === 6) return ar ? "كل 6 ساعات" : "Every 6 hours";
    if (hours === 12) return ar ? "كل 12 ساعة" : "Every 12 hours";
    if (hours === 24) return ar ? "يوميًا" : "Daily";
    return ar ? "أسبوعيًا" : "Weekly";
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h4">
          {ar ? "النسخ الاحتياطي والاستعادة" : "Backup & Restore"}
        </Typography>
        <Typography color="text.secondary">
          {ar
            ? "إنشاء نسخ يدوية أو جدولة نسخ تلقائية كاملة لبيانات النظام والقراءات."
            : "Create manual backups or schedule complete automatic system and telemetry backups."}
        </Typography>
      </Box>
      {error ? <Alert severity="error">{error}</Alert> : null}
      {message ? <Alert severity="success">{message}</Alert> : null}

      <Card variant="outlined">
        <CardContent>
          <Typography variant="h6">
            {ar ? "النسخ التلقائي" : "Automatic backup"}
          </Typography>
          {schedule ? (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={schedule.enabled}
                    onChange={(_, enabled) =>
                      setSchedule({ ...schedule, enabled })
                    }
                  />
                }
                label={ar ? "تفعيل النسخ التلقائي" : "Enable automatic backup"}
              />
              <Select
                aria-label={ar ? "تكرار النسخ" : "Backup frequency"}
                value={schedule.intervalHours}
                onChange={(event) =>
                  setSchedule({
                    ...schedule,
                    intervalHours: Number(
                      event.target.value,
                    ) as BackupSchedule["intervalHours"],
                  })
                }
              >
                {intervalOptions.map((hours) => (
                  <MenuItem key={hours} value={hours}>
                    {intervalLabel(hours)}
                  </MenuItem>
                ))}
              </Select>
              <TextField
                label={ar ? "عدد النسخ المحتفظ بها" : "Backups to retain"}
                type="number"
                value={schedule.retentionCount}
                slotProps={{ htmlInput: { min: 1, max: 30 } }}
                onChange={(event) =>
                  setSchedule({
                    ...schedule,
                    retentionCount: Math.max(
                      1,
                      Math.min(30, Number(event.target.value)),
                    ),
                  })
                }
              />
              <Typography variant="body2">
                {ar ? "النسخة التالية:" : "Next backup:"}{" "}
                {schedule.nextRunAt
                  ? new Date(schedule.nextRunAt).toLocaleString()
                  : ar
                    ? "متوقف"
                    : "Disabled"}
              </Typography>
              <Typography variant="body2">
                {ar ? "آخر نجاح:" : "Last success:"}{" "}
                {backups[0]
                  ? `${new Date(backups[0].createdAt).toLocaleString()} · ${
                      backups[0].source === "AUTOMATIC"
                        ? ar
                          ? "تلقائي"
                          : "Automatic"
                        : ar
                          ? "يدوي"
                          : "Manual"
                    }`
                  : ar
                    ? "لا يوجد"
                    : "None"}
              </Typography>
              {schedule.lastFailure ? (
                <Alert severity="warning">{schedule.lastFailure}</Alert>
              ) : null}
              <Button
                disabled={busy}
                onClick={saveSchedule}
                variant="contained"
              >
                {ar ? "حفظ إعدادات الجدولة" : "Save schedule"}
              </Button>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <Button
          disabled={busy}
          onClick={() =>
            void act(
              () => request(basePath, { method: "POST" }),
              ar ? "تم إنشاء النسخة الاحتياطية." : "Backup created.",
            )
          }
          variant="contained"
        >
          {ar ? "إنشاء نسخة احتياطية الآن" : "Create backup now"}
        </Button>
        <Button disabled={busy} onClick={() => void load()} variant="outlined">
          {ar ? "تحديث القائمة" : "Refresh"}
        </Button>
      </Stack>

      <Stack spacing={2}>
        {backups.length === 0 ? (
          <Alert severity="info">
            {ar ? "لا توجد نسخ احتياطية مكتملة." : "No completed backups."}
          </Alert>
        ) : (
          backups.map((backup) => (
            <Card key={backup.backupId} variant="outlined">
              <CardContent>
                <Stack spacing={1}>
                  <Typography variant="h6">
                    {new Date(backup.createdAt).toLocaleString()}
                  </Typography>
                  <Typography variant="body2">
                    {backup.identity.customerCode} / {backup.identity.siteCode}
                  </Typography>
                  <Typography variant="body2">
                    {ar ? "الحجم:" : "Size:"}{" "}
                    {(backup.totalBytes / 1024 / 1024).toFixed(1)} MB ·{" "}
                    {ar ? "الملفات:" : "Artifacts:"} {backup.artifactCount}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                    <Button
                      disabled={busy}
                      onClick={() => restore(backup.backupId)}
                      color="warning"
                    >
                      {ar ? "استعادة" : "Restore"}
                    </Button>
                    {disasterRecovery ? (
                      <Button
                        disabled={busy}
                        onClick={() => restore(backup.backupId, true)}
                        color="error"
                      >
                        {ar ? "استعادة طوارئ ونقل الهوية" : "Disaster recovery"}
                      </Button>
                    ) : null}
                  </Stack>
                </Stack>
              </CardContent>
            </Card>
          ))
        )}
      </Stack>
    </Stack>
  );
}
