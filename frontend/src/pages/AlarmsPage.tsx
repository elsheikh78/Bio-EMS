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

export function AlarmsPage() {
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
          Operational Alarm lifecycle
        </Typography>
        <Typography component="h1" variant="h4">
          Alarms
        </Typography>
        <Typography color="text.secondary">
          Review current and historical Alarm evidence and acknowledge eligible
          active events.
        </Typography>
      </Box>
      <Stack direction="row" spacing={1}>
        <Button
          variant={activeOnly ? "contained" : "outlined"}
          onClick={() => setActiveOnly(true)}
        >
          Active
        </Button>
        <Button
          variant={!activeOnly ? "contained" : "outlined"}
          onClick={() => setActiveOnly(false)}
        >
          History
        </Button>
        <Button onClick={() => void alarms.refetch()}>Refresh</Button>
      </Stack>
      {alarms.isPending ? (
        <CircularProgress aria-label="Loading Alarms" />
      ) : null}
      {alarms.isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => void alarms.refetch()}>Retry</Button>}
        >
          Unable to load Alarms.
        </Alert>
      ) : null}
      {acknowledge.isError ? (
        <Alert severity="error">
          Alarm acknowledgement failed or the Alarm state changed.
        </Alert>
      ) : null}
      {!alarms.isPending && !alarms.isError && visible.length === 0 ? (
        <Alert severity="info">No Alarms match this view.</Alert>
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
                  Sensor #{alarm.sensor_id} · Trigger value{" "}
                  {alarm.trigger_value}
                </Typography>
                <Typography variant="body2">
                  Triggered:{" "}
                  {alarm.trigger_time ?? alarm.created_at ?? "Unavailable"}
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
                  label={alarm.severity}
                />
                <Chip variant="outlined" label={alarm.status} />
                {alarm.status === "TRIGGERED" && canAcknowledge ? (
                  <Button
                    disabled={acknowledge.isPending}
                    onClick={() => acknowledge.mutate(alarm.id)}
                  >
                    Acknowledge
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
