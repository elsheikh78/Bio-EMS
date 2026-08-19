import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
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
import { useMemo, useState, type FormEvent } from "react";
import { useSensors } from "../monitoredAreas/queries";
import {
  useCalibrationReportPreview,
  useReportCatalogue,
} from "../reports/queries";

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

export function ReportsCenterPage() {
  const catalogue = useReportCatalogue();
  const sensorsQuery = useSensors();
  const preview = useCalibrationReportPreview();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 30);
    return dateValue(date);
  });
  const [to, setTo] = useState(() => dateValue(new Date()));
  const [selected, setSelected] = useState<string[]>([]);
  const sensors = useMemo(() => sensorsQuery.data ?? [], [sensorsQuery.data]);
  const selectedSensors =
    selected.length === 0 ? sensors.map((sensor) => sensor.uuid) : selected;
  const calibrationFamily = catalogue.data?.reportTypes.find(
    (item) => item.id === "CALIBRATION-HISTORY",
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    if (selectedSensors.length === 0) return;
    preview.mutate({
      reportType: "CALIBRATION-HISTORY",
      contractVersion: "1.0",
      sensorUuids: selectedSensors,
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T00:00:00`).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en",
    });
  }

  const loading = catalogue.isLoading || sensorsQuery.isLoading;
  const loadError = catalogue.isError || sensorsQuery.isError;

  return (
    <Stack spacing={5}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={3}
        sx={{ justifyContent: "space-between", alignItems: { md: "center" } }}
      >
        <Box>
          <Typography variant="overline" color="primary.main">
            Controlled reporting / Version 1.0
          </Typography>
          <Typography component="h1" variant="h4">
            Reports Center
          </Typography>
          <Typography color="text.secondary">
            Build reproducible operational reports from approved recorded
            evidence.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label="SQLite calibration evidence"
            color="primary"
            variant="outlined"
          />
          <Chip label="PDF & CSV planned" variant="outlined" />
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={2}>
          <CircularProgress size={22} />
          <Typography>Loading reporting scope…</Typography>
        </Stack>
      ) : null}
      {loadError ? (
        <Alert
          severity="error"
          action={
            <Button
              onClick={() => {
                void catalogue.refetch();
                void sensorsQuery.refetch();
              }}
            >
              Retry
            </Button>
          }
        >
          The reporting catalogue or Sensor scope could not be loaded.
        </Alert>
      ) : null}

      {!loading && !loadError ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 0.8fr) minmax(0, 1.2fr)",
            },
            gap: 4,
            alignItems: "start",
          }}
        >
          <Stack spacing={4}>
            <Paper
              variant="outlined"
              sx={{
                p: 4,
                borderRadius: 4,
                borderTop: "4px solid",
                borderTopColor: "primary.main",
              }}
            >
              <Typography variant="overline" color="primary.main">
                Available now
              </Typography>
              <Typography variant="h5">
                {calibrationFamily?.title ?? "Calibration Status and History"}
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                Current calibration state, due classification, immutable
                PASS/FAIL attempts, certificates, and quality warnings.
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Chip size="small" color="success" label="Preview available" />
                <Chip size="small" label="366-day maximum" />
              </Stack>
            </Paper>

            <Paper
              component="form"
              onSubmit={submit}
              variant="outlined"
              sx={{ p: 4, borderRadius: 4 }}
            >
              <Typography variant="h6">Report builder</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                Choose the recorded Sensor scope and half-open reporting range.
              </Typography>
              <Stack spacing={3}>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="From"
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label="To (exclusive)"
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
                <Box>
                  <Typography variant="subtitle2">Sensors</Typography>
                  <Typography variant="caption" color="text.secondary">
                    No manual selection means all {sensors.length} Sensors.
                  </Typography>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                      mt: 1,
                    }}
                  >
                    {sensors.map((sensor) => (
                      <FormControlLabel
                        key={sensor.uuid}
                        control={
                          <Checkbox
                            checked={selected.includes(sensor.uuid)}
                            onChange={(event) =>
                              setSelected((current) =>
                                event.target.checked
                                  ? [...current, sensor.uuid]
                                  : current.filter(
                                      (uuid) => uuid !== sensor.uuid,
                                    ),
                              )
                            }
                          />
                        }
                        label={`${sensor.name} · ${sensor.code}`}
                      />
                    ))}
                  </Box>
                </Box>
                <Alert severity="info" icon={false}>
                  <strong>Selection summary:</strong> {selectedSensors.length}{" "}
                  Sensors · {from} to {to} ·{" "}
                  {Intl.DateTimeFormat().resolvedOptions().timeZone}
                </Alert>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    preview.isPending ||
                    selectedSensors.length === 0 ||
                    !from ||
                    !to
                  }
                >
                  {preview.isPending
                    ? "Generating preview…"
                    : "Generate preview"}
                </Button>
              </Stack>
            </Paper>
          </Stack>

          <PreviewPanel preview={preview} />
        </Box>
      ) : null}
    </Stack>
  );
}

function PreviewPanel({
  preview,
}: {
  preview: ReturnType<typeof useCalibrationReportPreview>;
}) {
  if (preview.isError)
    return (
      <Alert severity="error">
        The preview could not be generated. Check the Sensor scope and date
        range, then try again.
      </Alert>
    );
  if (!preview.data)
    return (
      <Paper
        variant="outlined"
        sx={{
          minHeight: 420,
          p: 5,
          borderRadius: 4,
          display: "grid",
          placeItems: "center",
          textAlign: "center",
        }}
      >
        <Box>
          <Typography variant="h5">Preview workspace</Typography>
          <Typography color="text.secondary">
            Generate a report to display its controlled metadata, evidence
            summary, warnings, and underlying records.
          </Typography>
        </Box>
      </Paper>
    );
  const data = preview.data;
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="overline" color="primary.main">
              Canonical preview
            </Typography>
            <Typography variant="h5">Calibration evidence</Typography>
          </Box>
          <Box sx={{ textAlign: { sm: "right" } }}>
            <Typography variant="caption" color="text.secondary">
              Report ID
            </Typography>
            <Typography sx={{ fontFamily: "monospace", fontWeight: 700 }}>
              {data.identity.reportId}
            </Typography>
          </Box>
        </Stack>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 2,
            mt: 4,
          }}
        >
          {[
            ["Sensors", data.summary.sensors],
            ["Attempts", data.summary.records],
            ["Overdue", data.summary.overdue],
            ["PASS", data.summary.pass],
            ["FAIL", data.summary.fail],
            ["Not calibrated", data.summary.notCalibrated],
          ].map(([label, value]) => (
            <Box
              key={label}
              sx={{ p: 2, bgcolor: "background.default", borderRadius: 2 }}
            >
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5">{value}</Typography>
            </Box>
          ))}
        </Box>
      </Paper>
      {data.quality.warnings.length ? (
        <Alert severity="warning">
          {data.quality.warnings.length} evidence-quality warning(s) are
          recorded. Missing values were not fabricated.
        </Alert>
      ) : (
        <Alert severity="success">
          The selected report evidence passed current completeness checks.
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h6">Calibration attempt distribution</Typography>
        <Typography color="text.secondary" variant="body2">
          PASS and FAIL attempts recorded inside the selected range.
        </Typography>
        <Box
          role="img"
          aria-label={`${data.summary.pass} passing and ${data.summary.fail} failing calibration attempts`}
          sx={{
            display: "flex",
            height: 14,
            overflow: "hidden",
            borderRadius: 99,
            bgcolor: "grey.200",
            mt: 3,
          }}
        >
          {data.summary.records > 0 ? (
            <>
              <Box
                sx={{
                  width: `${(data.summary.pass / data.summary.records) * 100}%`,
                  bgcolor: "success.main",
                }}
              />
              <Box
                sx={{
                  width: `${(data.summary.fail / data.summary.records) * 100}%`,
                  bgcolor: "error.main",
                }}
              />
            </>
          ) : null}
        </Box>
        <Stack direction="row" spacing={4} sx={{ mt: 2 }}>
          <Typography variant="body2" color="success.main">
            ● PASS {data.summary.pass}
          </Typography>
          <Typography variant="body2" color="error.main">
            ● FAIL {data.summary.fail}
          </Typography>
        </Stack>
      </Paper>
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 4 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sensor</TableCell>
              <TableCell>Result</TableCell>
              <TableCell>Performed</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  No calibration attempts were recorded in this range.
                </TableCell>
              </TableRow>
            ) : (
              data.records.map((record, index) => (
                <TableRow
                  key={`${record.sensor_uuid}-${record.performed_at}-${index}`}
                >
                  <TableCell>{record.sensor_uuid}</TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      color={record.result === "PASS" ? "success" : "error"}
                      label={record.result}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(record.performed_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <Typography variant="caption" color="text.secondary">
        Generated {new Date(data.provenance.generatedAt).toLocaleString()} ·
        Source: {data.provenance.source} · Range:{" "}
        {data.provenance.rangeSemantics}
      </Typography>
    </Stack>
  );
}
