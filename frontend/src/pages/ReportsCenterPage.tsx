import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  MenuItem,
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
import { hasPermission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import { useSensors } from "../monitoredAreas/queries";
import {
  useCalibrationReportCsvExport,
  useCalibrationReportPdfExport,
  useCalibrationReportPreview,
  useReportCatalogue,
  useTemperaturePerformanceCsvExport,
  useTemperaturePerformancePdfExport,
  useTemperaturePerformancePreview,
  useOperationalReportExport,
  useOperationalReportPreview,
} from "../reports/queries";

type SelectableReportType =
  | "CALIBRATION-HISTORY"
  | "TEMP-PERFORMANCE"
  | "ALARM-HISTORY"
  | "DEVICE-HEALTH"
  | "AUDIT-OPERATIONS";

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function downloadReport(file: { blob: Blob; filename: string }) {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export function ReportsCenterPage() {
  const catalogue = useReportCatalogue();
  const sensorsQuery = useSensors();
  const preview = useCalibrationReportPreview();
  const csvExport = useCalibrationReportCsvExport();
  const pdfExport = useCalibrationReportPdfExport();
  const temperaturePreview = useTemperaturePerformancePreview();
  const temperatureCsvExport = useTemperaturePerformanceCsvExport();
  const temperaturePdfExport = useTemperaturePerformancePdfExport();
  const operationalPreview = useOperationalReportPreview();
  const operationalExport = useOperationalReportExport();
  const { user } = useAuthentication();
  const [from, setFrom] = useState(() => {
    const date = new Date();
    date.setUTCDate(date.getUTCDate() - 30);
    return dateValue(date);
  });
  const [to, setTo] = useState(() => dateValue(new Date()));
  const [selected, setSelected] = useState<string[]>([]);
  const [reportType, setReportType] = useState<SelectableReportType>(
    "CALIBRATION-HISTORY",
  );
  const sensors = useMemo(() => sensorsQuery.data ?? [], [sensorsQuery.data]);
  const selectedSensors =
    selected.length === 0 ? sensors.map((sensor) => sensor.uuid) : selected;
  const calibrationFamily = catalogue.data?.reportTypes.find(
    (item) => item.id === "CALIBRATION-HISTORY",
  );
  const selectedFamily = catalogue.data?.reportTypes.find(
    (item) => item.id === reportType,
  );
  const csvAvailable = selectedFamily?.exportFormats.includes("CSV") ?? false;
  const pdfAvailable = selectedFamily?.exportFormats.includes("PDF") ?? false;
  const canExport = Boolean(user && hasPermission(user.role, "REPORT_EXPORT"));

  function reportRequest() {
    return {
      reportType: "CALIBRATION-HISTORY" as const,
      contractVersion: "1.0" as const,
      sensorUuids: selectedSensors,
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T00:00:00`).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language: "en" as const,
    };
  }

  function temperatureReportRequest() {
    return {
      ...reportRequest(),
      reportType: "TEMP-PERFORMANCE" as const,
    };
  }

  function operationalReportRequest() {
    return {
      ...reportRequest(),
      reportType: reportType as
        "ALARM-HISTORY" | "DEVICE-HEALTH" | "AUDIT-OPERATIONS",
    };
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (selectedSensors.length === 0) return;
    if (reportType === "TEMP-PERFORMANCE") {
      temperaturePreview.mutate(temperatureReportRequest());
    } else if (reportType === "CALIBRATION-HISTORY") {
      preview.mutate(reportRequest());
    } else {
      operationalPreview.mutate(operationalReportRequest());
    }
  }

  async function exportCsv() {
    if (reportType === "TEMP-PERFORMANCE") {
      downloadReport(
        await temperatureCsvExport.mutateAsync({
          ...temperatureReportRequest(),
          format: "CSV",
        }),
      );
      return;
    }
    if (reportType !== "CALIBRATION-HISTORY") {
      downloadReport(
        await operationalExport.mutateAsync({
          ...operationalReportRequest(),
          format: "CSV",
        }),
      );
      return;
    }
    const file = await csvExport.mutateAsync({
      ...reportRequest(),
      format: "CSV",
    });
    downloadReport(file);
  }

  async function exportPdf() {
    if (reportType === "TEMP-PERFORMANCE") {
      downloadReport(
        await temperaturePdfExport.mutateAsync({
          ...temperatureReportRequest(),
          format: "PDF",
        }),
      );
      return;
    }
    if (reportType !== "CALIBRATION-HISTORY") {
      downloadReport(
        await operationalExport.mutateAsync({
          ...operationalReportRequest(),
          format: "PDF",
        }),
      );
      return;
    }
    const file = await pdfExport.mutateAsync({
      ...reportRequest(),
      format: "PDF",
    });
    downloadReport(file);
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
          <Chip
            label={csvAvailable ? "CSV available" : "CSV unavailable"}
            color={csvAvailable ? "success" : "default"}
            variant="outlined"
          />
          <Chip
            label={pdfAvailable ? "PDF available" : "PDF unavailable"}
            color={pdfAvailable ? "success" : "default"}
            variant="outlined"
          />
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

      {catalogue.data ? (
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 4 }}>
          <Typography variant="h6">Report family readiness</Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            Availability is contract-driven. A family is not presented as
            complete until its preview and controlled exports exist.
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Report family</TableCell>
                  <TableCell>Readiness</TableCell>
                  <TableCell>Preview</TableCell>
                  <TableCell>Exports</TableCell>
                  <TableCell>Remaining dependency</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {catalogue.data.reportTypes.map((family) => (
                  <TableRow key={family.id}>
                    <TableCell>{family.title}</TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={
                          family.readiness === "AVAILABLE"
                            ? "success"
                            : family.readiness === "BLOCKED"
                              ? "error"
                              : "warning"
                        }
                        label={family.readiness.replaceAll("_", " ")}
                      />
                    </TableCell>
                    <TableCell>
                      {family.previewAvailable ? "Available" : "Not available"}
                    </TableCell>
                    <TableCell>
                      {family.exportFormats.join(" / ") || "None"}
                    </TableCell>
                    <TableCell>
                      {family.unavailableReason?.replaceAll("_", " ") ?? "None"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
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
                <TextField
                  select
                  label="Report family"
                  value={reportType}
                  onChange={(event) => {
                    setReportType(event.target.value as SelectableReportType);
                    preview.reset();
                    temperaturePreview.reset();
                    operationalPreview.reset();
                  }}
                >
                  <MenuItem value="CALIBRATION-HISTORY">
                    Calibration Status and History
                  </MenuItem>
                  <MenuItem value="TEMP-PERFORMANCE">
                    Temperature Performance
                  </MenuItem>
                  <MenuItem value="ALARM-HISTORY">Alarm History</MenuItem>
                  <MenuItem value="DEVICE-HEALTH">
                    Device Communication Health
                  </MenuItem>
                  <MenuItem value="AUDIT-OPERATIONS">
                    Audit and Operations
                  </MenuItem>
                </TextField>
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
                    (reportType === "TEMP-PERFORMANCE"
                      ? temperaturePreview.isPending
                      : reportType === "CALIBRATION-HISTORY"
                        ? preview.isPending
                        : operationalPreview.isPending) ||
                    selectedSensors.length === 0 ||
                    !from ||
                    !to
                  }
                >
                  {(
                    reportType === "TEMP-PERFORMANCE"
                      ? temperaturePreview.isPending
                      : reportType === "CALIBRATION-HISTORY"
                        ? preview.isPending
                        : operationalPreview.isPending
                  )
                    ? "Generating preview…"
                    : "Generate preview"}
                </Button>
              </Stack>
            </Paper>
          </Stack>

          {reportType === "TEMP-PERFORMANCE" ? (
            <TemperaturePreviewPanel
              preview={temperaturePreview}
              canExport={canExport}
              csvAvailable={csvAvailable}
              pdfAvailable={pdfAvailable}
              csvExporting={temperatureCsvExport.isPending}
              pdfExporting={temperaturePdfExport.isPending}
              onExportCsv={() => void exportCsv()}
              onExportPdf={() => void exportPdf()}
            />
          ) : reportType === "CALIBRATION-HISTORY" ? (
            <PreviewPanel
              preview={preview}
              canExport={canExport}
              csvAvailable={csvAvailable}
              pdfAvailable={pdfAvailable}
              csvExporting={csvExport.isPending}
              pdfExporting={pdfExport.isPending}
              csvExportError={csvExport.isError}
              pdfExportError={pdfExport.isError}
              onExportCsv={() => void exportCsv()}
              onExportPdf={() => void exportPdf()}
            />
          ) : (
            <OperationalPreviewPanel
              preview={operationalPreview}
              canExport={canExport}
              exporting={operationalExport.isPending}
              onExportCsv={() => void exportCsv()}
              onExportPdf={() => void exportPdf()}
            />
          )}
        </Box>
      ) : null}
    </Stack>
  );
}

function PreviewPanel({
  preview,
  canExport,
  csvAvailable,
  pdfAvailable,
  csvExporting,
  pdfExporting,
  csvExportError,
  pdfExportError,
  onExportCsv,
  onExportPdf,
}: {
  preview: ReturnType<typeof useCalibrationReportPreview>;
  canExport: boolean;
  csvAvailable: boolean;
  pdfAvailable: boolean;
  csvExporting: boolean;
  pdfExporting: boolean;
  csvExportError: boolean;
  pdfExportError: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
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
      {csvExportError ? (
        <Alert severity="error">
          The CSV export could not be generated. The preview remains available.
        </Alert>
      ) : null}
      {pdfExportError ? (
        <Alert severity="error">
          The PDF export could not be generated. The preview remains available.
        </Alert>
      ) : null}
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
            <Typography
              sx={{
                fontFamily: "monospace",
                fontWeight: 700,
                fontSize: 12,
                maxWidth: 300,
                overflowWrap: "anywhere",
              }}
            >
              {data.identity.reportId}
            </Typography>
          </Box>
        </Stack>
        {canExport ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            {csvAvailable ? (
              <Button
                variant="outlined"
                disabled={csvExporting || pdfExporting}
                onClick={onExportCsv}
              >
                {csvExporting ? "Preparing CSV…" : "Export CSV"}
              </Button>
            ) : null}
            {pdfAvailable ? (
              <Button
                variant="outlined"
                disabled={pdfExporting || csvExporting}
                onClick={onExportPdf}
              >
                {pdfExporting ? "Preparing PDF…" : "Export PDF"}
              </Button>
            ) : null}
          </Stack>
        ) : (
          <Typography sx={{ mt: 3 }} variant="caption" color="text.secondary">
            Your role permits preview but not export.
          </Typography>
        )}
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
          <Typography variant="subtitle2">
            {data.quality.warnings.length} evidence-quality warning(s)
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            Missing values were not fabricated.
          </Typography>
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            sx={{ flexWrap: "wrap" }}
          >
            {data.quality.warnings.map((warning, index) => {
              const sensor = data.sensors.find(
                (item) => item.uuid === warning.sensorUuid,
              );
              const label =
                warning.code === "MISSING_HARDWARE_MODEL"
                  ? "Hardware model missing"
                  : warning.code === "MISSING_CERTIFICATE_REFERENCE"
                    ? "Certificate reference missing"
                    : warning.code;
              return (
                <Chip
                  key={`${warning.sensorUuid}-${warning.code}-${index}`}
                  size="small"
                  label={`${sensor?.name ?? warning.sensorUuid}: ${label}`}
                />
              );
            })}
          </Stack>
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
            ● PASS {data.summary.pass} ·{" "}
            {percentage(data.summary.pass, data.summary.records)}%
          </Typography>
          <Typography variant="body2" color="error.main">
            ● FAIL {data.summary.fail} ·{" "}
            {percentage(data.summary.fail, data.summary.records)}%
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
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>
                      {data.sensors.find(
                        (sensor) => sensor.uuid === record.sensor_uuid,
                      )?.name ?? record.sensor_uuid}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {sensorContext(
                        data.sensors.find(
                          (sensor) => sensor.uuid === record.sensor_uuid,
                        ),
                      )}
                    </Typography>
                  </TableCell>
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

function percentage(value: number, total: number) {
  return total === 0 ? 0 : Math.round((value / total) * 100);
}

function TemperaturePreviewPanel({
  preview,
  canExport,
  csvAvailable,
  pdfAvailable,
  csvExporting,
  pdfExporting,
  onExportCsv,
  onExportPdf,
}: {
  preview: ReturnType<typeof useTemperaturePerformancePreview>;
  canExport: boolean;
  csvAvailable: boolean;
  pdfAvailable: boolean;
  csvExporting: boolean;
  pdfExporting: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  if (preview.isError) {
    return (
      <Alert severity="error">
        The temperature preview could not be generated.
      </Alert>
    );
  }
  if (!preview.data) {
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
          <Typography variant="h5">Temperature preview workspace</Typography>
          <Typography color="text.secondary">
            Generate a report to inspect recorded temperature evidence and
            summary statistics.
          </Typography>
        </Box>
      </Paper>
    );
  }

  const data = preview.data;
  const display = (value: number | null) =>
    value === null ? "—" : value.toFixed(2);

  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="overline" color="primary.main">
          Canonical preview
        </Typography>
        <Typography variant="h5">Temperature performance</Typography>
        <Typography variant="caption" color="text.secondary">
          {data.identity.reportId}
        </Typography>
        {canExport ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            {csvAvailable ? (
              <Button
                variant="outlined"
                disabled={csvExporting || pdfExporting}
                onClick={onExportCsv}
              >
                {csvExporting ? "Preparing CSV…" : "Export CSV"}
              </Button>
            ) : null}
            {pdfAvailable ? (
              <Button
                variant="outlined"
                disabled={pdfExporting || csvExporting}
                onClick={onExportPdf}
              >
                {pdfExporting ? "Preparing PDF…" : "Export PDF"}
              </Button>
            ) : null}
          </Stack>
        ) : null}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(5, 1fr)" },
            gap: 2,
            mt: 4,
          }}
        >
          {[
            ["Sensors", data.summary.sensors],
            ["Readings", data.summary.records],
            ["Minimum", display(data.summary.minimum)],
            ["Average", display(data.summary.average)],
            ["Maximum", display(data.summary.maximum)],
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
      {data.quality.complete ? (
        <Alert severity="success">
          All selected Sensors supplied recorded telemetry.
        </Alert>
      ) : (
        <Alert severity="warning">
          {data.quality.warnings.join(" · ") ||
            "Temperature evidence is incomplete."}
        </Alert>
      )}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 4 }}
      >
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Sensor</TableCell>
              <TableCell>Readings</TableCell>
              <TableCell>Minimum</TableCell>
              <TableCell>Average</TableCell>
              <TableCell>Maximum</TableCell>
              <TableCell>Recorded range</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.sensors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  No temperature readings were recorded in this range.
                </TableCell>
              </TableRow>
            ) : (
              data.sensors.map((sensor) => (
                <TableRow key={sensor.sensor}>
                  <TableCell>{sensor.sensor}</TableCell>
                  <TableCell>{sensor.records}</TableCell>
                  <TableCell>
                    {display(sensor.minimum)} {sensor.unit}
                  </TableCell>
                  <TableCell>
                    {display(sensor.average)} {sensor.unit}
                  </TableCell>
                  <TableCell>
                    {display(sensor.maximum)} {sensor.unit}
                  </TableCell>
                  <TableCell>
                    {sensor.firstReadingAt
                      ? new Date(sensor.firstReadingAt).toLocaleString()
                      : "—"}{" "}
                    —{" "}
                    {sensor.lastReadingAt
                      ? new Date(sensor.lastReadingAt).toLocaleString()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function OperationalPreviewPanel({
  preview,
  canExport,
  exporting,
  onExportCsv,
  onExportPdf,
}: {
  preview: ReturnType<typeof useOperationalReportPreview>;
  canExport: boolean;
  exporting: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
}) {
  if (preview.isError)
    return (
      <Alert severity="error">
        The operational report could not be generated.
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
        }}
      >
        <Typography variant="h5">Operational preview workspace</Typography>
      </Paper>
    );
  const data = preview.data;
  const columns = Array.from(
    new Set(data.records.flatMap((record) => Object.keys(record))),
  );
  return (
    <Stack spacing={3}>
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="overline" color="primary.main">
          Canonical preview
        </Typography>
        <Typography variant="h5">
          {data.identity.reportType.replaceAll("-", " ")}
        </Typography>
        <Typography color="text.secondary">
          {data.summary.records} recorded event(s)
        </Typography>
        {canExport ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              disabled={exporting}
              onClick={onExportCsv}
            >
              Export CSV
            </Button>
            <Button
              variant="outlined"
              disabled={exporting}
              onClick={onExportPdf}
            >
              Export PDF
            </Button>
          </Stack>
        ) : null}
      </Paper>
      {data.quality.warnings.length ? (
        <Alert severity="info">{data.quality.warnings.join(" · ")}</Alert>
      ) : (
        <Alert severity="success">
          The selected evidence projection is complete.
        </Alert>
      )}
      <TableContainer
        component={Paper}
        variant="outlined"
        sx={{ borderRadius: 4, maxHeight: 560 }}
      >
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              {columns.map((column) => (
                <TableCell key={column}>
                  {column.replaceAll("_", " ")}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {data.records.length ? (
              data.records.map((record, index) => (
                <TableRow key={String(record.id ?? index)}>
                  {columns.map((column) => (
                    <TableCell key={column}>
                      {String(record[column] ?? "—")}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={Math.max(columns.length, 1)}>
                  No records in this range.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}

function sensorContext(
  sensor:
    | {
        code: string;
        room_name: string;
        site_name: string;
      }
    | undefined,
) {
  return sensor
    ? `${sensor.code} · ${sensor.room_name} · ${sensor.site_name}`
    : "Sensor identity unavailable";
}
