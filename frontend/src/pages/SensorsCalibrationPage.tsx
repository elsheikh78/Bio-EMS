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
import type { Sensor } from "../monitoredAreas/contracts";
import { useSensors } from "../monitoredAreas/queries";

const calibrationOrder = ["EXPIRED", "DUE", "NOT_CALIBRATED", "VALID"] as const;

export function SensorsCalibrationPage() {
  const query = useSensors();

  if (query.isPending) {
    return (
      <Stack direction="row" spacing={3} sx={{ alignItems: "center" }}>
        <CircularProgress size={24} />
        <Typography>Loading Sensors and calibration status</Typography>
      </Stack>
    );
  }

  if (query.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button color="inherit" onClick={() => void query.refetch()}>
            Retry
          </Button>
        }
      >
        Sensors and calibration status could not be loaded.
      </Alert>
    );
  }

  const sensors = [...(query.data ?? [])].sort(
    (first, second) =>
      calibrationOrder.indexOf(first.calibration_status ?? "NOT_CALIBRATED") -
        calibrationOrder.indexOf(
          second.calibration_status ?? "NOT_CALIBRATED",
        ) || first.code.localeCompare(second.code),
  );
  const counts = sensors.reduce(
    (summary, sensor) => {
      summary[sensor.calibration_status ?? "NOT_CALIBRATED"] += 1;
      return summary;
    },
    { VALID: 0, DUE: 0, EXPIRED: 0, NOT_CALIBRATED: 0 },
  );

  return (
    <Stack spacing={6}>
      <Box>
        <Typography component="h1" variant="h4">
          Sensors &amp; Calibration
        </Typography>
        <Typography color="text.secondary">
          Controlled Sensor identity, installation context, and current
          calibration evidence.
        </Typography>
      </Box>

      <Box
        component="section"
        aria-label="Calibration summary"
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: 3,
        }}
      >
        <Metric label="Valid" value={counts.VALID} tone="success.main" />
        <Metric label="Due" value={counts.DUE} tone="warning.main" />
        <Metric label="Expired" value={counts.EXPIRED} tone="error.main" />
        <Metric
          label="Not calibrated"
          value={counts.NOT_CALIBRATED}
          tone="text.secondary"
        />
      </Box>

      {sensors.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, borderRadius: 3.5 }}>
          <Typography color="text.secondary">
            No Sensors are currently configured.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            gap: 4,
          }}
        >
          {sensors.map((sensor) => (
            <SensorCard key={sensor.uuid} sensor={sensor} />
          ))}
        </Box>
      )}
    </Stack>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 5,
        borderRadius: 3.5,
        borderInlineStart: 5,
        borderInlineStartColor: tone,
      }}
    >
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{ textTransform: "uppercase", letterSpacing: 0.7 }}
      >
        {label}
      </Typography>
      <Typography
        variant="h4"
        sx={{ mt: 2, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function SensorCard({ sensor }: { sensor: Sensor }) {
  const status = sensor.calibration_status ?? "NOT_CALIBRATED";
  const color =
    status === "VALID"
      ? "success"
      : status === "DUE"
        ? "warning"
        : status === "EXPIRED"
          ? "error"
          : "default";

  return (
    <Paper
      variant="outlined"
      sx={{
        p: 5,
        borderRadius: 3.5,
        boxShadow: "0 8px 24px rgba(7, 59, 76, 0.06)",
      }}
    >
      <Stack spacing={4}>
        <Stack
          direction="row"
          spacing={3}
          sx={{ justifyContent: "space-between", alignItems: "flex-start" }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" variant="h6">
              {sensor.name}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {sensor.code} · Channel {sensor.channel}
            </Typography>
          </Box>
          <Chip
            label={status.replaceAll("_", " ")}
            color={color}
            size="small"
            variant={status === "VALID" ? "filled" : "outlined"}
          />
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 3,
          }}
        >
          <Evidence label="Type" value={sensor.sensor_type} />
          <Evidence label="Unit" value={sensor.unit} />
          <Evidence label="Hardware" value={sensor.hardware_model} />
          <Evidence label="Product grade" value={sensor.product_grade} />
          <Evidence label="Last calibrated" value={sensor.last_calibrated_at} />
          <Evidence label="Calibration due" value={sensor.calibration_due_at} />
          <Evidence
            label="Offset"
            value={
              sensor.calibration_offset == null
                ? undefined
                : `${sensor.calibration_offset} ${sensor.unit}`
            }
          />
          <Evidence label="Certificate" value={sensor.certificate_reference} />
        </Box>
        <Typography variant="caption" color="text.secondary">
          Sensor UUID: {sensor.uuid}
        </Typography>
      </Stack>
    </Paper>
  );
}

function Evidence({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 600, overflowWrap: "anywhere" }}
      >
        {value ?? "Not available"}
      </Typography>
    </Box>
  );
}
