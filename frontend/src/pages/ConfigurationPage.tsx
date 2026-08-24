import {
  Alert,
  Box,
  Button,
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
import { type FormEvent, useMemo, useState } from "react";
import {
  useUpdateSensorAlarmDelay,
  useUpdateSensorThresholds,
} from "../configuration/queries";
import type { Sensor } from "../monitoredAreas/contracts";
import { useSensors } from "../monitoredAreas/queries";

export function ConfigurationPage() {
  const sensorsQuery = useSensors();
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Sensor>();
  const sensors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (sensorsQuery.data ?? []).filter(
      (sensor) =>
        !term ||
        [sensor.name, sensor.code, sensor.sensor_type, sensor.uuid].some(
          (value) => value.toLowerCase().includes(term),
        ),
    );
  }, [search, sensorsQuery.data]);

  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Controlled configuration
        </Typography>
        <Typography component="h1" variant="h4">
          Sensor thresholds &amp; alarm delays
        </Typography>
        <Typography color="text.secondary">
          ADMIN-only editing of persisted alarm evaluation settings. Live
          telemetry is not changed here.
        </Typography>
      </Box>

      {sensorsQuery.isPending ? (
        <CircularProgress aria-label="Loading sensors" />
      ) : null}
      {sensorsQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button color="inherit" onClick={() => void sensorsQuery.refetch()}>
              Retry
            </Button>
          }
        >
          Unable to load sensor configuration.
        </Alert>
      ) : null}
      {!sensorsQuery.isPending && !sensorsQuery.isError ? (
        <Paper variant="outlined" sx={{ p: 3 }}>
          <Stack spacing={3}>
            <TextField
              label="Search sensors"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {sensors.length === 0 ? (
              <Alert severity="info">
                No sensors match the current search.
              </Alert>
            ) : (
              sensors.map((sensor) => (
                <Box
                  key={sensor.uuid}
                  sx={{
                    display: "flex",
                    gap: 2,
                    alignItems: { sm: "center" },
                    justifyContent: "space-between",
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box>
                    <Typography component="h2" variant="h6">
                      {sensor.name}
                    </Typography>
                    <Typography color="text.secondary">
                      {sensor.code} · {sensor.sensor_type} · {sensor.unit}
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    onClick={() => setSelected(sensor)}
                    aria-label={`Edit ${sensor.name}`}
                  >
                    Edit configuration
                  </Button>
                </Box>
              ))
            )}
          </Stack>
        </Paper>
      ) : null}
      {selected ? (
        <SensorConfigurationDialog
          sensor={selected}
          onClose={() => setSelected(undefined)}
        />
      ) : null}
    </Stack>
  );
}

interface DialogProps {
  sensor: Sensor;
  onClose: () => void;
}

function SensorConfigurationDialog({ sensor, onClose }: DialogProps) {
  const thresholds = useUpdateSensorThresholds(sensor.uuid);
  const delays = useUpdateSensorAlarmDelay(sensor.uuid);
  const [values, setValues] = useState(() => ({
    alarm_low: formatValue(sensor.alarm_low),
    warning_low: formatValue(sensor.warning_low),
    warning_high: formatValue(sensor.warning_high),
    alarm_high: formatValue(sensor.alarm_high),
    warning_delay_seconds: String(sensor.warning_delay_seconds ?? 0),
    critical_delay_seconds: String(sensor.critical_delay_seconds ?? 0),
  }));
  const [validation, setValidation] = useState<string>();
  const pending = thresholds.isPending || delays.isPending;

  function setField(field: keyof typeof values, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseConfiguration(values);
    if (typeof parsed === "string") {
      setValidation(parsed);
      return;
    }
    setValidation(undefined);
    try {
      await thresholds.mutateAsync(parsed.thresholds);
      await delays.mutateAsync(parsed.delays);
    } catch {
      /* mutation state renders the error */
    }
  }

  const failed = thresholds.isError || delays.isError;
  const saved = thresholds.isSuccess && delays.isSuccess;
  return (
    <Dialog
      open
      onClose={pending ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>Edit {sensor.name}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <Alert severity="info">
              Values must follow alarm low ≤ warning low ≤ warning high ≤ alarm
              high.
            </Alert>
            {validation ? <Alert severity="error">{validation}</Alert> : null}
            {failed ? (
              <Alert severity="error">
                Configuration could not be saved. No completion is claimed.
              </Alert>
            ) : null}
            {saved ? (
              <Alert severity="success">
                Configuration saved and the sensor register is refreshing.
              </Alert>
            ) : null}
            {(
              [
                "alarm_low",
                "warning_low",
                "warning_high",
                "alarm_high",
              ] as const
            ).map((field) => (
              <TextField
                key={field}
                type="number"
                required
                label={label(field)}
                value={values[field]}
                onChange={(event) => setField(field, event.target.value)}
                slotProps={{ htmlInput: { step: "any" } }}
              />
            ))}
            <TextField
              type="number"
              required
              label="Warning delay (seconds)"
              value={values.warning_delay_seconds}
              onChange={(event) =>
                setField("warning_delay_seconds", event.target.value)
              }
              slotProps={{ htmlInput: { min: 0, max: 86400, step: 1 } }}
            />
            <TextField
              type="number"
              required
              label="Critical delay (seconds)"
              value={values.critical_delay_seconds}
              onChange={(event) =>
                setField("critical_delay_seconds", event.target.value)
              }
              slotProps={{ htmlInput: { min: 0, max: 86400, step: 1 } }}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={pending}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={pending}>
            {pending ? "Saving…" : "Save configuration"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function formatValue(value: number | null | undefined) {
  return value == null ? "" : String(value);
}
function label(value: string) {
  return value
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}

function parseConfiguration(values: Record<string, string>) {
  const names = [
    "alarm_low",
    "warning_low",
    "warning_high",
    "alarm_high",
  ] as const;
  const ordered = names.map((name) => Number(values[name]));
  if (ordered.some((value) => !Number.isFinite(value)))
    return "All threshold values are required finite numbers.";
  if (
    !ordered.every((value, index) => index === 0 || ordered[index - 1] <= value)
  )
    return "Threshold order is invalid.";
  const warning = Number(values.warning_delay_seconds);
  const critical = Number(values.critical_delay_seconds);
  if (
    ![warning, critical].every(
      (value) => Number.isInteger(value) && value >= 0 && value <= 86_400,
    )
  )
    return "Delays must be whole seconds from 0 to 86400.";
  return {
    thresholds: Object.fromEntries(
      names.map((name, index) => [name, ordered[index]]),
    ),
    delays: {
      warning_delay_seconds: warning,
      critical_delay_seconds: critical,
    },
  };
}
