import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useSites } from "../monitoredAreas/queries";
import {
  deliveryStatuses,
  type DeliveryStatus,
} from "../notificationDeliveries/contracts";
import { useNotificationDeliveries } from "../notificationDeliveries/queries";
import { summarizeDeliveries } from "../notificationDeliveries/presentation";
import { useLocalization } from "../localization/useLocalization";

export function NotificationDeliveriesPage() {
  const { language } = useLocalization();
  const t = (english: string, arabic: string) =>
    language === "ar" ? arabic : english;
  const sites = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number>();
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const siteId = selectedSiteId ?? sites.data?.find((site) => site.id)?.id;
  const deliveries = useNotificationDeliveries(
    siteId,
    status === "ALL" ? undefined : status,
  );
  const records = deliveries.data ?? [];
  const summary = summarizeDeliveries(records);

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {t("Notification operations", "عمليات الإشعارات")}
        </Typography>
        <Typography component="h1" variant="h4">
          {t("Notification Delivery", "إرسال الإشعارات")}
        </Typography>
        <Typography color="text.secondary">
          {t(
            "Live evidence for queued, sent, retried, failed, and cancelled Alarm notifications.",
            "أدلة حية لإشعارات الإنذارات المنتظرة والمرسلة والمعاد إرسالها والفاشلة والملغاة.",
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
          [
            t("Queued / retrying", "في الانتظار / إعادة المحاولة"),
            summary.queued,
            "warning.main",
          ],
          [t("Successful", "ناجحة"), summary.successful, "success.main"],
          [t("Failed", "فاشلة"), summary.failed, "error.main"],
          [t("Cancelled", "ملغاة"), summary.cancelled, "text.secondary"],
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
      <Paper variant="outlined" sx={{ bgcolor: "action.hover", p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="delivery-site-label">
              {t("Site", "الموقع")}
            </InputLabel>
            <Select
              labelId="delivery-site-label"
              label={t("Site", "الموقع")}
              value={siteId ?? ""}
              onChange={(event) =>
                setSelectedSiteId(Number(event.target.value))
              }
            >
              {(sites.data ?? []).map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel id="delivery-status-label">
              {t("Status", "الحالة")}
            </InputLabel>
            <Select
              labelId="delivery-status-label"
              label={t("Status", "الحالة")}
              value={status}
              onChange={(event) => setStatus(event.target.value)}
            >
              <MenuItem value="ALL">{t("All statuses", "كل الحالات")}</MenuItem>
              {deliveryStatuses.map((value) => (
                <MenuItem key={value} value={value}>
                  {localizeDeliveryValue(value, language)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => void deliveries.refetch()}
            disabled={!siteId || deliveries.isFetching}
          >
            {t("Refresh", "تحديث")}
          </Button>
        </Stack>
      </Paper>
      {sites.isError || deliveries.isError ? (
        <Alert severity="error">
          {t(
            "Unable to load notification delivery evidence.",
            "تعذر تحميل أدلة إرسال الإشعارات.",
          )}
        </Alert>
      ) : null}
      {!siteId ? (
        <Alert severity="info">
          {t(
            "Select a Site to view notification delivery evidence.",
            "اختر موقعًا لعرض أدلة إرسال الإشعارات.",
          )}
        </Alert>
      ) : null}
      {siteId &&
      !deliveries.isPending &&
      (deliveries.data?.length ?? 0) === 0 ? (
        <Alert severity="info">
          {t(
            "No delivery jobs match this view.",
            "لا توجد مهام إرسال تطابق هذا العرض.",
          )}
        </Alert>
      ) : null}
      {records.length > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t("Created", "تاريخ الإنشاء")}</TableCell>
                <TableCell>{t("Alarm", "الإنذار")}</TableCell>
                <TableCell>{t("Recipient", "المستلم")}</TableCell>
                <TableCell>{t("Channel", "القناة")}</TableCell>
                <TableCell>{t("Status", "الحالة")}</TableCell>
                <TableCell>{t("Attempts", "المحاولات")}</TableCell>
                <TableCell>{t("Last result", "آخر نتيجة")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {records.map((delivery) => {
                const result = [...delivery.attempts]
                  .reverse()
                  .find((attempt) => attempt.phase === "RESULT");
                return (
                  <TableRow key={delivery.uuid}>
                    <TableCell>{delivery.created_at}</TableCell>
                    <TableCell>
                      #{delivery.source_id} · {delivery.severity}
                    </TableCell>
                    <TableCell>
                      {delivery.recipient_name}
                      <Typography variant="caption" sx={{ display: "block" }}>
                        {delivery.recipient_role}
                      </Typography>
                    </TableCell>
                    <TableCell>{delivery.channel}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        label={localizeDeliveryValue(delivery.status, language)}
                        color={
                          delivery.status === "DEAD_LETTER" ||
                          delivery.status === "FAILED"
                            ? "error"
                            : delivery.status === "DELIVERED" ||
                                delivery.status === "SENT"
                              ? "success"
                              : "default"
                        }
                      />
                    </TableCell>
                    <TableCell>
                      {delivery.attempt_count}/{delivery.max_attempts}
                    </TableCell>
                    <TableCell>
                      {result?.error_code ??
                        result?.status ??
                        delivery.last_error_code ??
                        "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      ) : null}
    </Stack>
  );
}

function localizeDeliveryValue(value: string, language: "en" | "ar") {
  if (language === "en") return value;
  return (
    (
      {
        QUEUED: "في الانتظار",
        SENDING: "جارٍ الإرسال",
        SENT: "أُرسلت",
        DELIVERED: "تم التسليم",
        RETRY: "إعادة محاولة",
        FAILED: "فشلت",
        DEAD_LETTER: "فشل نهائي",
        CANCELLED: "ملغاة",
      } as Record<string, string>
    )[value] ?? value
  );
}
