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
import { useState } from "react";
import { useAuthentication } from "../auth/useAuthentication";
import { hasPermission } from "../authorization/permissions";
import { useLocalization } from "../localization/useLocalization";
import type { Device } from "../devices/contracts";
import {
  useDeviceHealth,
  useDeviceMutation,
  useDevices,
} from "../devices/queries";

export function DevicesPage() {
  const { language } = useLocalization();
  const t = (english: string, arabic: string) =>
    language === "ar" ? arabic : english;
  const devices = useDevices();
  const mutation = useDeviceMutation();
  const { user } = useAuthentication();
  const canManage = Boolean(user && hasPermission(user.role, "DEVICE_MANAGE"));
  const [selected, setSelected] = useState<Device | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);
  const health = useDeviceHealth(selected?.device_id ?? null);
  const save = () => {
    if (!editing) return;
    mutation.mutate(
      {
        id: editing.device_id,
        update: {
          device_type: editing.device_type,
          protocol: editing.protocol,
          manufacturer: editing.manufacturer ?? undefined,
          model: editing.model ?? undefined,
          firmware_version: editing.firmware_version ?? undefined,
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  };
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {t("Device registry & health", "سجل الأجهزة وحالتها")}
        </Typography>
        <Typography component="h1" variant="h4">
          {t("Devices", "الأجهزة")}
        </Typography>
        <Typography color="text.secondary">
          {t(
            "Review registered controllers, communication health, and controlled lifecycle state.",
            "راجع وحدات التحكم المسجلة وحالة الاتصال ودورة الحياة المنضبطة.",
          )}
        </Typography>
      </Box>
      <Button
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void devices.refetch()}
      >
        {t("Refresh", "تحديث")}
      </Button>
      {devices.isPending ? (
        <CircularProgress
          aria-label={t("Loading Devices", "جارٍ تحميل الأجهزة")}
        />
      ) : null}
      {devices.isError ? (
        <Alert
          severity="error"
          action={
            <Button onClick={() => void devices.refetch()}>
              {t("Retry", "إعادة المحاولة")}
            </Button>
          }
        >
          {t("Unable to load Devices.", "تعذر تحميل الأجهزة.")}
        </Alert>
      ) : null}
      {mutation.isError ? (
        <Alert severity="error">
          {t(
            "Device update failed or its lifecycle state changed.",
            "فشل تحديث الجهاز أو تغيرت حالة دورة حياته.",
          )}
        </Alert>
      ) : null}
      {!devices.isPending && !devices.isError && devices.data?.length === 0 ? (
        <Alert severity="info">
          {t("No Devices are registered.", "لا توجد أجهزة مسجلة.")}
        </Alert>
      ) : null}
      {(devices.data ?? []).map((device) => (
        <Paper key={device.device_id} variant="outlined" sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6">{device.device_id}</Typography>
              <Typography>
                {device.device_type} · {device.protocol}
              </Typography>
              <Typography color="text.secondary">
                {t("Site", "الموقع")} #{device.site_id} ·{" "}
                {[device.manufacturer, device.model, device.firmware_version]
                  .filter(Boolean)
                  .join(" · ") ||
                  t("Metadata unavailable", "بيانات التعريف غير متاحة")}
              </Typography>
              <Typography variant="body2">
                {t("Last seen", "آخر اتصال")}:{" "}
                {device.last_seen_at ?? t("Never", "لم يتصل")}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Chip
                label={localizeDeviceValue(device.status, language)}
                color={
                  device.status === "active"
                    ? "success"
                    : device.status === "disabled"
                      ? "default"
                      : "warning"
                }
              />
              <Button onClick={() => setSelected(device)}>
                {t("Health", "الحالة")}
              </Button>
              {canManage ? (
                <>
                  <Button onClick={() => setEditing(device)}>
                    {t("Edit", "تعديل")}
                  </Button>
                  {device.status === "active" ? (
                    <Button
                      color="warning"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: device.device_id,
                          action: "disable",
                        })
                      }
                    >
                      {t("Disable", "تعطيل")}
                    </Button>
                  ) : (
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: device.device_id,
                          action: "activate",
                        })
                      }
                    >
                      {t("Activate", "تفعيل")}
                    </Button>
                  )}
                </>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      ))}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
      >
        <DialogTitle>
          {t("Communication health", "حالة الاتصال")} · {selected?.device_id}
        </DialogTitle>
        <DialogContent>
          {health.isPending ? <CircularProgress /> : null}
          {health.isError ? (
            <Alert severity="error">
              {t(
                "Unable to load Device health.",
                "تعذر تحميل حالة اتصال الجهاز.",
              )}
            </Alert>
          ) : null}
          {health.data ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Chip
                sx={{ alignSelf: "flex-start" }}
                label={localizeDeviceValue(
                  health.data.communication_status,
                  language,
                )}
                color={
                  health.data.communication_status === "ONLINE"
                    ? "success"
                    : health.data.communication_status === "OFFLINE"
                      ? "error"
                      : "warning"
                }
              />
              <Typography>
                {t("Last heartbeat", "آخر نبضة اتصال")}:{" "}
                {health.data.last_heartbeat_at ?? t("Never", "لا توجد")}
              </Typography>
              <Typography>
                {t("Seconds since seen", "الثواني منذ آخر اتصال")}:{" "}
                {health.data.seconds_since_seen ?? t("Unavailable", "غير متاح")}
              </Typography>
              <Typography variant="body2">
                {t("Stale after", "يُعد متأخرًا بعد")}{" "}
                {health.data.stale_after_seconds}
                {t("s", " ث")} · {t("offline after", "وغير متصل بعد")}{" "}
                {health.data.offline_after_seconds}s
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>
            {t("Close", "إغلاق")}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        fullWidth
      >
        <DialogTitle>
          {t("Edit Device metadata", "تعديل بيانات الجهاز")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {(
              [
                "device_type",
                "protocol",
                "manufacturer",
                "model",
                "firmware_version",
              ] as const
            ).map((field) => (
              <TextField
                key={field}
                required={field === "device_type" || field === "protocol"}
                label={localizeDeviceField(field, language)}
                value={editing?.[field] ?? ""}
                onChange={(event) =>
                  setEditing((current) =>
                    current
                      ? { ...current, [field]: event.target.value }
                      : current,
                  )
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button
            disabled={
              !editing?.device_type.trim() ||
              !editing?.protocol.trim() ||
              mutation.isPending
            }
            onClick={save}
          >
            {t("Save", "حفظ")}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

function localizeDeviceValue(value: string, language: "en" | "ar") {
  if (language === "en") return value;
  return (
    (
      {
        active: "نشط",
        disabled: "معطّل",
        pending: "قيد الانتظار",
        ONLINE: "متصل",
        OFFLINE: "غير متصل",
        STALE: "بيانات متأخرة",
        NEVER_SEEN: "لم يتصل سابقًا",
      } as Record<string, string>
    )[value] ?? value
  );
}

function localizeDeviceField(field: string, language: "en" | "ar") {
  if (language === "en") return field.replaceAll("_", " ");
  return (
    (
      {
        device_type: "نوع الجهاز",
        protocol: "البروتوكول",
        manufacturer: "الشركة المصنعة",
        model: "الموديل",
        firmware_version: "إصدار البرنامج الثابت",
      } as Record<string, string>
    )[field] ?? field
  );
}
