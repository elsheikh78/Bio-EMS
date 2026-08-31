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

export function NotificationDeliveriesPage() {
  const sites = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number>();
  const [status, setStatus] = useState<DeliveryStatus | "ALL">("ALL");
  const siteId = selectedSiteId ?? sites.data?.find((site) => site.id)?.id;
  const deliveries = useNotificationDeliveries(
    siteId,
    status === "ALL" ? undefined : status,
  );

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Notification operations
        </Typography>
        <Typography component="h1" variant="h4">
          Notification Delivery
        </Typography>
        <Typography color="text.secondary">
          Live evidence for queued, sent, retried, failed, and cancelled Alarm
          notifications.
        </Typography>
      </Box>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="delivery-site-label">Site</InputLabel>
          <Select
            labelId="delivery-site-label"
            label="Site"
            value={siteId ?? ""}
            onChange={(event) => setSelectedSiteId(Number(event.target.value))}
          >
            {(sites.data ?? []).map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel id="delivery-status-label">Status</InputLabel>
          <Select
            labelId="delivery-status-label"
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            {deliveryStatuses.map((value) => (
              <MenuItem key={value} value={value}>
                {value}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={() => void deliveries.refetch()} disabled={!siteId}>
          Refresh
        </Button>
      </Stack>
      {sites.isError || deliveries.isError ? (
        <Alert severity="error">
          Unable to load notification delivery evidence.
        </Alert>
      ) : null}
      {!siteId ? (
        <Alert severity="info">
          Select a Site to view notification delivery evidence.
        </Alert>
      ) : null}
      {siteId &&
      !deliveries.isPending &&
      (deliveries.data?.length ?? 0) === 0 ? (
        <Alert severity="info">No delivery jobs match this view.</Alert>
      ) : null}
      {(deliveries.data?.length ?? 0) > 0 ? (
        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Created</TableCell>
                <TableCell>Alarm</TableCell>
                <TableCell>Recipient</TableCell>
                <TableCell>Channel</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Attempts</TableCell>
                <TableCell>Last result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {deliveries.data?.map((delivery) => {
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
                        label={delivery.status}
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
