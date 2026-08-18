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
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useMemo, useState } from "react";
import { hasPermission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import type {
  CreateCalibrationRecordInput,
  Sensor,
} from "../monitoredAreas/contracts";
import {
  useCalibrationHistory,
  useCreateCalibrationRecord,
  useSensors,
} from "../monitoredAreas/queries";

type CalibrationStatus = NonNullable<Sensor["calibration_status"]>;
const calibrationOrder: CalibrationStatus[] = [
  "EXPIRED",
  "DUE",
  "NOT_CALIBRATED",
  "VALID",
];

export function SensorsCalibrationPage() {
  const query = useSensors();
  const { user } = useAuthentication();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [selectedSensor, setSelectedSensor] = useState<Sensor>();
  const [recording, setRecording] = useState(false);

  const allSensors = useMemo(() => query.data ?? [], [query.data]);
  const sensors = useMemo(() => {
    const term = search.trim().toLowerCase();
    return [...allSensors]
      .filter((sensor) => {
        const status = sensor.calibration_status ?? "NOT_CALIBRATED";
        const matchesSearch =
          !term ||
          [sensor.name, sensor.code, sensor.hardware_model, sensor.uuid]
            .filter(Boolean)
            .some((value) => value!.toLowerCase().includes(term));
        return (
          matchesSearch &&
          (statusFilter === "ALL" || status === statusFilter) &&
          (typeFilter === "ALL" || sensor.sensor_type === typeFilter)
        );
      })
      .sort(
        (a, b) =>
          calibrationOrder.indexOf(a.calibration_status ?? "NOT_CALIBRATED") -
            calibrationOrder.indexOf(
              b.calibration_status ?? "NOT_CALIBRATED",
            ) || a.code.localeCompare(b.code),
      );
  }, [allSensors, search, statusFilter, typeFilter]);

  const counts = countStatuses(allSensors);
  const types = [
    ...new Set(allSensors.map((sensor) => sensor.sensor_type)),
  ].sort();
  const canWrite = Boolean(
    user && hasPermission(user.role, "CONFIGURATION_WRITE"),
  );

  return (
    <Stack spacing={5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <Box>
          <Typography variant="overline" color="primary.main">
            Asset quality / Calibration control
          </Typography>
          <Typography component="h1" variant="h4">
            Sensors &amp; Calibration
          </Typography>
          <Typography color="text.secondary">
            Traceable sensor identity, calibration status, and audit evidence.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={() => void query.refetch()}>
          Refresh register
        </Button>
      </Stack>

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

      <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3.5 }}>
        <Stack spacing={4}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={3}
            sx={{
              justifyContent: "space-between",
              alignItems: { lg: "center" },
            }}
          >
            <Box>
              <Typography component="h2" variant="h6">
                Calibration register
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {sensors.length} of {allSensors.length} sensors shown
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                size="small"
                label="Search sensors"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: 230 }}
              />
              <FormControl size="small" sx={{ minWidth: 165 }}>
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All statuses</MenuItem>
                  {calibrationOrder.map((status) => (
                    <MenuItem key={status} value={status}>
                      {formatStatus(status)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 155 }}>
                <InputLabel id="type-filter-label">Sensor type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  label="Sensor type"
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <MenuItem value="ALL">All types</MenuItem>
                  {types.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Stack>
          </Stack>

          {query.isPending ? (
            <Stack
              role="status"
              direction="row"
              spacing={2}
              sx={{ alignItems: "center", py: 6 }}
            >
              <CircularProgress size={24} />
              <Typography>Loading sensors and calibration status</Typography>
            </Stack>
          ) : query.isError ? (
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
          ) : sensors.length === 0 ? (
            <Alert severity="info">No sensors match the current filters.</Alert>
          ) : (
            <TableContainer>
              <Table
                aria-label="Sensor calibration register"
                sx={{ "& .MuiTableCell-root": { fontSize: "0.84rem" } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>Sensor</TableCell>
                    <TableCell>Type / hardware</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Last calibrated</TableCell>
                    <TableCell>Due date</TableCell>
                    <TableCell>Certificate</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sensors.map((sensor) => (
                    <TableRow key={sensor.uuid} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {sensor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sensor.code} · CH {sensor.channel}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {sensor.sensor_type} · {sensor.unit}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {sensor.hardware_model ?? "Hardware not recorded"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          status={sensor.calibration_status ?? "NOT_CALIBRATED"}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(sensor.last_calibrated_at)}
                      </TableCell>
                      <TableCell>
                        {formatDate(sensor.calibration_due_at)}
                      </TableCell>
                      <TableCell>
                        {sensor.certificate_reference ?? "—"}
                      </TableCell>
                      <TableCell align="right">
                        <Stack
                          direction="row"
                          spacing={1}
                          sx={{ justifyContent: "flex-end" }}
                        >
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedSensor(sensor);
                              setRecording(false);
                            }}
                          >
                            History
                          </Button>
                          {canWrite && (
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => {
                                setSelectedSensor(sensor);
                                setRecording(true);
                              }}
                            >
                              Record
                            </Button>
                          )}
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Stack>
      </Paper>

      <CalibrationDialog
        sensor={selectedSensor}
        recording={recording}
        canWrite={canWrite}
        onClose={() => setSelectedSensor(undefined)}
        onRecord={() => setRecording(true)}
      />
    </Stack>
  );
}

function CalibrationDialog({
  sensor,
  recording,
  canWrite,
  onClose,
  onRecord,
}: {
  sensor?: Sensor;
  recording: boolean;
  canWrite: boolean;
  onClose: () => void;
  onRecord: () => void;
}) {
  const history = useCalibrationHistory(sensor?.uuid);
  const mutation = useCreateCalibrationRecord(sensor?.uuid);
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const field = (name: string) => {
      const value = data.get(name);
      return typeof value === "string" ? value : "";
    };
    const payload: CreateCalibrationRecordInput = {
      result,
      performed_at: new Date(field("performed_at")).toISOString(),
    };
    const certificate = field("certificate_reference").trim();
    const notes = field("notes").trim();
    if (result === "PASS") {
      payload.due_at = new Date(field("due_at")).toISOString();
      payload.offset = Number(field("offset"));
    }
    if (certificate) payload.certificate_reference = certificate;
    if (notes) payload.notes = notes;
    await mutation.mutateAsync(payload);
  }

  return (
    <Dialog open={Boolean(sensor)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {recording ? "Record calibration" : "Calibration history"}
      </DialogTitle>
      <DialogContent>
        {sensor && (
          <Stack spacing={4} sx={{ pt: 1 }}>
            <Box>
              <Typography sx={{ fontWeight: 700 }}>{sensor.name}</Typography>
              <Typography variant="body2" color="text.secondary">
                {sensor.code} · {sensor.uuid}
              </Typography>
            </Box>
            {recording ? (
              <Box
                component="form"
                id="calibration-form"
                onSubmit={(event) => void submit(event)}
              >
                <Stack spacing={3}>
                  {mutation.isError && (
                    <Alert severity="error">
                      Calibration record could not be saved.
                    </Alert>
                  )}
                  {mutation.isSuccess && (
                    <Alert severity="success">
                      Calibration record saved and register refreshed.
                    </Alert>
                  )}
                  <FormControl fullWidth>
                    <InputLabel id="result-label">Result</InputLabel>
                    <Select
                      labelId="result-label"
                      label="Result"
                      value={result}
                      onChange={(event) => setResult(event.target.value)}
                    >
                      <MenuItem value="PASS">Pass</MenuItem>
                      <MenuItem value="FAIL">Fail</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    name="performed_at"
                    label="Performed at"
                    type="datetime-local"
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  {result === "PASS" && (
                    <>
                      <TextField
                        name="due_at"
                        label="Next calibration due"
                        type="datetime-local"
                        required
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                      <TextField
                        name="offset"
                        label={`Measured offset (${sensor.unit})`}
                        type="number"
                        required
                        slotProps={{ htmlInput: { step: "any" } }}
                      />
                    </>
                  )}
                  <TextField
                    name="certificate_reference"
                    label="Certificate reference"
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                  />
                  <TextField
                    name="notes"
                    label="Notes"
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 2000 } }}
                  />
                </Stack>
              </Box>
            ) : history.isPending ? (
              <CircularProgress size={24} />
            ) : history.isError ? (
              <Alert severity="error">
                Calibration history could not be loaded.
              </Alert>
            ) : history.data?.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Result</TableCell>
                    <TableCell>Performed</TableCell>
                    <TableCell>Due</TableCell>
                    <TableCell>Certificate</TableCell>
                    <TableCell>Performed by</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {history.data.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Chip
                          size="small"
                          label={record.result}
                          color={record.result === "PASS" ? "success" : "error"}
                        />
                      </TableCell>
                      <TableCell>{formatDate(record.performed_at)}</TableCell>
                      <TableCell>{formatDate(record.due_at)}</TableCell>
                      <TableCell>
                        {record.certificate_reference ?? "—"}
                      </TableCell>
                      <TableCell>{record.performed_by_username}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert severity="info">
                No calibration history has been recorded.
              </Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        {!recording && canWrite && (
          <Button variant="contained" onClick={onRecord}>
            Record calibration
          </Button>
        )}
        {recording && (
          <Button
            type="submit"
            form="calibration-form"
            variant="contained"
            disabled={mutation.isPending}
          >
            Save calibration
          </Button>
        )}
      </DialogActions>
    </Dialog>
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
      sx={{ p: 4, borderRadius: 3.5, borderTop: 4, borderTopColor: tone }}
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
        sx={{ mt: 1, fontVariantNumeric: "tabular-nums" }}
      >
        {value}
      </Typography>
    </Paper>
  );
}

function StatusChip({ status }: { status: CalibrationStatus }) {
  const color =
    status === "VALID"
      ? "success"
      : status === "DUE"
        ? "warning"
        : status === "EXPIRED"
          ? "error"
          : "default";
  return (
    <Chip
      label={formatStatus(status)}
      color={color}
      size="small"
      variant={status === "VALID" ? "filled" : "outlined"}
    />
  );
}

function countStatuses(sensors: Sensor[]) {
  return sensors.reduce(
    (summary, sensor) => {
      summary[sensor.calibration_status ?? "NOT_CALIBRATED"] += 1;
      return summary;
    },
    { VALID: 0, DUE: 0, EXPIRED: 0, NOT_CALIBRATED: 0 },
  );
}

function formatStatus(status: string) {
  return status.replaceAll("_", " ");
}
function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat("en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}
