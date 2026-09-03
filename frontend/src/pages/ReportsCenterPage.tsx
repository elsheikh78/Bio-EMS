import {
  Alert,
  Box,
  Button,
  ButtonBase,
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
import { useLocalization } from "../localization/useLocalization";
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

const reportPresentation: Record<
  SelectableReportType,
  { title: string; description: string; source: string; accent: string }
> = {
  "TEMP-PERFORMANCE": {
    title: "Temperature Performance",
    description:
      "Trends, excursions, compliance, minimum, maximum, and average temperature.",
    source: "InfluxDB telemetry evidence",
    accent: "#1976d2",
  },
  "ALARM-HISTORY": {
    title: "Alarm History",
    description:
      "Triggered, acknowledged, and recovered Alarm lifecycle evidence.",
    source: "SQLite Alarm lifecycle",
    accent: "#d32f2f",
  },
  "CALIBRATION-HISTORY": {
    title: "Calibration Status and History",
    description:
      "Current status, due dates, PASS/FAIL attempts, and certificate references.",
    source: "SQLite calibration evidence",
    accent: "#00897b",
  },
  "DEVICE-HEALTH": {
    title: "Device Communication Health",
    description:
      "Durable telemetry and heartbeat communication history by Device.",
    source: "SQLite communication ledger",
    accent: "#ed6c02",
  },
  "AUDIT-OPERATIONS": {
    title: "Audit and Operations",
    description:
      "Immutable actor, action, result, target, and operational evidence.",
    source: "SQLite immutable Audit evidence",
    accent: "#7b1fa2",
  },
};

const arabicReportPresentation: typeof reportPresentation = {
  "TEMP-PERFORMANCE": {
    title: "أداء درجات الحرارة",
    description:
      "الاتجاهات والتجاوزات والامتثال والحد الأدنى والأقصى ومتوسط درجة الحرارة.",
    source: "أدلة القراءات من InfluxDB",
    accent: "#1976d2",
  },
  "ALARM-HISTORY": {
    title: "سجل الإنذارات",
    description:
      "أدلة دورة حياة الإنذار من التفعيل والإقرار والعودة للوضع الطبيعي.",
    source: "دورة حياة الإنذار في SQLite",
    accent: "#d32f2f",
  },
  "CALIBRATION-HISTORY": {
    title: "حالة المعايرة وسجلها",
    description:
      "الحالة الحالية ومواعيد الاستحقاق ومحاولات النجاح والفشل ومراجع الشهادات.",
    source: "أدلة المعايرة في SQLite",
    accent: "#00897b",
  },
  "DEVICE-HEALTH": {
    title: "حالة اتصال الأجهزة",
    description: "السجل الدائم للقراءات ونبضات الاتصال لكل جهاز.",
    source: "سجل الاتصال في SQLite",
    accent: "#ed6c02",
  },
  "AUDIT-OPERATIONS": {
    title: "التدقيق والعمليات",
    description:
      "أدلة غير قابلة للتعديل للمنفذ والإجراء والنتيجة والهدف والعمليات.",
    source: "أدلة التدقيق الثابتة في SQLite",
    accent: "#7b1fa2",
  },
};

const reportOrder = Object.keys(reportPresentation) as SelectableReportType[];

function dateValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function downloadReport(file: { blob: Blob; filename: string }) {
  const url = URL.createObjectURL(file.blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = file.filename;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function ReportsCenterPage() {
  const { language } = useLocalization();
  const ar = language === "ar";
  const t = (english: string, arabic: string) => (ar ? arabic : english);
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
  const [reportType, setReportType] =
    useState<SelectableReportType>("TEMP-PERFORMANCE");
  const sensors = useMemo(() => sensorsQuery.data ?? [], [sensorsQuery.data]);
  const selectedSensors =
    selected.length === 0 ? sensors.map((sensor) => sensor.uuid) : selected;
  const presentations = ar ? arabicReportPresentation : reportPresentation;
  const presentation = presentations[reportType];
  const selectedFamily = catalogue.data?.reportTypes.find(
    (item) => item.id === reportType,
  );
  const csvAvailable = selectedFamily?.exportFormats.includes("CSV") ?? false;
  const pdfAvailable = selectedFamily?.exportFormats.includes("PDF") ?? false;
  const canExport = Boolean(user && hasPermission(user.role, "REPORT_EXPORT"));

  function selectReport(next: SelectableReportType) {
    setReportType(next);
    preview.reset();
    temperaturePreview.reset();
    operationalPreview.reset();
  }

  function reportRequest() {
    return {
      reportType: "CALIBRATION-HISTORY" as const,
      contractVersion: "1.0" as const,
      sensorUuids: selectedSensors,
      from: new Date(`${from}T00:00:00`).toISOString(),
      to: new Date(`${to}T00:00:00`).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      language,
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
            {t(
              "Controlled reporting / Version 1.0",
              "تقارير منضبطة / الإصدار 1.0",
            )}
          </Typography>
          <Typography component="h1" variant="h4">
            {t("Reports Center", "مركز التقارير")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Build reproducible operational reports from approved recorded evidence.",
              "أنشئ تقارير تشغيلية قابلة لإعادة الإنتاج من الأدلة المسجلة والمعتمدة.",
            )}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Chip
            label={presentation.source}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={
              csvAvailable
                ? t("CSV available", "CSV متاح")
                : t("CSV unavailable", "CSV غير متاح")
            }
            color={csvAvailable ? "success" : "default"}
            variant="outlined"
          />
          <Chip
            label={
              pdfAvailable
                ? t("PDF available", "PDF متاح")
                : t("PDF unavailable", "PDF غير متاح")
            }
            color={pdfAvailable ? "success" : "default"}
            variant="outlined"
          />
        </Stack>
      </Stack>

      {loading ? (
        <Stack direction="row" spacing={2}>
          <CircularProgress size={22} />
          <Typography>
            {t("Loading reporting scope…", "جارٍ تحميل نطاق التقارير…")}
          </Typography>
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
              {t("Retry", "إعادة المحاولة")}
            </Button>
          }
        >
          {t(
            "The reporting catalogue or Sensor scope could not be loaded.",
            "تعذر تحميل دليل التقارير أو نطاق الحساسات.",
          )}
        </Alert>
      ) : null}

      {catalogue.data ? (
        <Box>
          <Typography variant="h6">
            {t("Choose a report", "اختر تقريرًا")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {t(
              "Five operational report families are ready for preview and controlled export.",
              "خمس مجموعات من التقارير التشغيلية جاهزة للمعاينة والتصدير المنضبط.",
            )}
          </Typography>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "repeat(5, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {reportOrder.map((type) => {
              const item = presentations[type];
              const family = catalogue.data.reportTypes.find(
                (entry) => entry.id === type,
              );
              const active = reportType === type;
              return (
                <ButtonBase
                  key={type}
                  aria-pressed={active}
                  onClick={() => selectReport(type)}
                  sx={{
                    textAlign: "left",
                    borderRadius: 3,
                    alignItems: "stretch",
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      width: "100%",
                      minHeight: 154,
                      p: 2.5,
                      borderRadius: 3,
                      borderWidth: active ? 2 : 1,
                      borderColor: active ? item.accent : "divider",
                      boxShadow: active
                        ? `0 10px 28px ${item.accent}22`
                        : "none",
                      transition:
                        "border-color 160ms, box-shadow 160ms, transform 160ms",
                      transform: active ? "translateY(-2px)" : "none",
                    }}
                  >
                    <Stack
                      direction="row"
                      spacing={1}
                      sx={{ justifyContent: "space-between" }}
                    >
                      <Chip
                        size="small"
                        color={
                          family?.readiness === "AVAILABLE"
                            ? "success"
                            : "default"
                        }
                        label={
                          family?.readiness === "AVAILABLE"
                            ? t("READY", "جاهز")
                            : t("UNAVAILABLE", "غير متاح")
                        }
                      />
                      <Typography sx={{ color: item.accent, fontWeight: 800 }}>
                        {active ? t("SELECTED", "محدد") : t("OPEN", "فتح")}
                      </Typography>
                    </Stack>
                    <Typography variant="h6" sx={{ mt: 1.5, lineHeight: 1.15 }}>
                      {item.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 1 }}
                    >
                      {item.description}
                    </Typography>
                  </Paper>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>
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
                {t("Selected report", "التقرير المحدد")}
              </Typography>
              <Typography variant="h5">{presentation.title}</Typography>
              <Typography color="text.secondary" sx={{ mt: 1 }}>
                {presentation.description}
              </Typography>
              <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
                <Chip
                  size="small"
                  color="success"
                  label={t("Preview available", "المعاينة متاحة")}
                />
                <Chip size="small" label="CSV / PDF" />
              </Stack>
            </Paper>

            <Paper
              component="form"
              onSubmit={submit}
              variant="outlined"
              sx={{ p: 4, borderRadius: 4 }}
            >
              <Typography variant="h6">
                {t("Report builder", "منشئ التقارير")}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {t(
                  "Choose the recorded Sensor scope and half-open reporting range.",
                  "اختر نطاق الحساسات المسجل والفترة الزمنية للتقرير.",
                )}
              </Typography>
              <Stack spacing={3}>
                <TextField
                  select
                  label={t("Report family", "مجموعة التقرير")}
                  value={reportType}
                  onChange={(event) =>
                    selectReport(event.target.value as SelectableReportType)
                  }
                >
                  <MenuItem value="CALIBRATION-HISTORY">
                    {presentations["CALIBRATION-HISTORY"].title}
                  </MenuItem>
                  <MenuItem value="TEMP-PERFORMANCE">
                    {presentations["TEMP-PERFORMANCE"].title}
                  </MenuItem>
                  <MenuItem value="ALARM-HISTORY">
                    {presentations["ALARM-HISTORY"].title}
                  </MenuItem>
                  <MenuItem value="DEVICE-HEALTH">
                    {presentations["DEVICE-HEALTH"].title}
                  </MenuItem>
                  <MenuItem value="AUDIT-OPERATIONS">
                    {presentations["AUDIT-OPERATIONS"].title}
                  </MenuItem>
                </TextField>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label={t("From", "من")}
                    value={from}
                    onChange={(event) => setFrom(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  <TextField
                    fullWidth
                    required
                    type="date"
                    label={t("To (exclusive)", "إلى (غير شامل)")}
                    value={to}
                    onChange={(event) => setTo(event.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Stack>
                <Box>
                  <Typography variant="subtitle2">
                    {t("Sensors", "الحساسات")}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {ar
                      ? `عدم الاختيار يدويًا يعني كل الحساسات وعددها ${sensors.length}.`
                      : `No manual selection means all ${sensors.length} Sensors.`}
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
                  <strong>{t("Selection summary:", "ملخص الاختيار:")}</strong>{" "}
                  {selectedSensors.length} {t("Sensors", "حساسات")} · {from}{" "}
                  {t("to", "إلى")} {to} ·{" "}
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
                    ? t("Generating preview…", "جارٍ إنشاء المعاينة…")
                    : t("Generate preview", "إنشاء المعاينة")}
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
              language={language}
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
              language={language}
            />
          ) : (
            <OperationalPreviewPanel
              preview={operationalPreview}
              reportTitle={presentation.title}
              canExport={canExport}
              exporting={operationalExport.isPending}
              exportError={operationalExport.isError}
              onExportCsv={() => void exportCsv()}
              onExportPdf={() => void exportPdf()}
              language={language}
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
  language,
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
  language: "en" | "ar";
}) {
  const ar = language === "ar";
  const t = (english: string, arabic: string) => (ar ? arabic : english);
  if (preview.isError)
    return (
      <Alert severity="error">
        {t(
          "The preview could not be generated. Check the Sensor scope and date range, then try again.",
          "تعذر إنشاء المعاينة. راجع نطاق الحساسات والفترة الزمنية ثم حاول مرة أخرى.",
        )}
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
          <Typography variant="h5">
            {t("Preview workspace", "مساحة المعاينة")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Generate a report to display its controlled metadata, evidence summary, warnings, and underlying records.",
              "أنشئ تقريرًا لعرض بياناته المنضبطة وملخص الأدلة والتحذيرات والسجلات الأساسية.",
            )}
          </Typography>
        </Box>
      </Paper>
    );
  const data = preview.data;
  return (
    <Stack spacing={3}>
      {csvExportError ? (
        <Alert severity="error">
          {t(
            "The CSV export could not be generated. The preview remains available.",
            "تعذر إنشاء ملف CSV، وتظل المعاينة متاحة.",
          )}
        </Alert>
      ) : null}
      {pdfExportError ? (
        <Alert severity="error">
          {t(
            "The PDF export could not be generated. The preview remains available.",
            "تعذر إنشاء ملف PDF، وتظل المعاينة متاحة.",
          )}
        </Alert>
      ) : null}
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          sx={{ justifyContent: "space-between" }}
        >
          <Box>
            <Typography variant="overline" color="primary.main">
              {t("Canonical preview", "المعاينة المعتمدة")}
            </Typography>
            <Typography variant="h5">
              {t("Calibration evidence", "أدلة المعايرة")}
            </Typography>
          </Box>
          <Box sx={{ textAlign: { sm: "right" } }}>
            <Typography variant="caption" color="text.secondary">
              {t("Report ID", "معرّف التقرير")}
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
                {csvExporting
                  ? t("Preparing CSV…", "جارٍ إعداد CSV…")
                  : t("Export CSV", "تصدير CSV")}
              </Button>
            ) : null}
            {pdfAvailable ? (
              <Button
                variant="outlined"
                disabled={pdfExporting || csvExporting}
                onClick={onExportPdf}
              >
                {pdfExporting
                  ? t("Preparing PDF…", "جارٍ إعداد PDF…")
                  : t("Export PDF", "تصدير PDF")}
              </Button>
            ) : null}
          </Stack>
        ) : (
          <Typography sx={{ mt: 3 }} variant="caption" color="text.secondary">
            {t(
              "Your role permits preview but not export.",
              "دورك يسمح بالمعاينة ولا يسمح بالتصدير.",
            )}
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
            [t("Sensors", "الحساسات"), data.summary.sensors],
            [t("Attempts", "المحاولات"), data.summary.records],
            [t("Overdue", "متأخرة"), data.summary.overdue],
            [t("PASS", "ناجح"), data.summary.pass],
            [t("FAIL", "راسب"), data.summary.fail],
            [t("Not calibrated", "غير معاير"), data.summary.notCalibrated],
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
            {data.quality.warnings.length}{" "}
            {t("evidence-quality warning(s)", "تحذيرات لجودة الأدلة")}
          </Typography>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t(
              "Missing values were not fabricated.",
              "لم يتم اختلاق القيم المفقودة.",
            )}
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
                  ? t("Hardware model missing", "موديل المكونات مفقود")
                  : warning.code === "MISSING_CERTIFICATE_REFERENCE"
                    ? t("Certificate reference missing", "مرجع الشهادة مفقود")
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
          {t(
            "The selected report evidence passed current completeness checks.",
            "اجتازت أدلة التقرير المحدد اختبارات الاكتمال الحالية.",
          )}
        </Alert>
      )}
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="h6">
          {t("Calibration attempt distribution", "توزيع محاولات المعايرة")}
        </Typography>
        <Typography color="text.secondary" variant="body2">
          {t(
            "PASS and FAIL attempts recorded inside the selected range.",
            "محاولات النجاح والفشل المسجلة داخل النطاق المحدد.",
          )}
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
              <TableCell>{t("Sensor", "الحساس")}</TableCell>
              <TableCell>{t("Result", "النتيجة")}</TableCell>
              <TableCell>{t("Performed", "وقت الإجراء")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.records.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3}>
                  {t(
                    "No calibration attempts were recorded in this range.",
                    "لم تُسجل محاولات معايرة في هذا النطاق.",
                  )}
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
  language,
}: {
  preview: ReturnType<typeof useTemperaturePerformancePreview>;
  canExport: boolean;
  csvAvailable: boolean;
  pdfAvailable: boolean;
  csvExporting: boolean;
  pdfExporting: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
  language: "en" | "ar";
}) {
  const ar = language === "ar";
  const t = (english: string, arabic: string) => (ar ? arabic : english);
  if (preview.isError) {
    return (
      <Alert severity="error">
        {t(
          "The temperature preview could not be generated.",
          "تعذر إنشاء معاينة درجات الحرارة.",
        )}
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
          <Typography variant="h5">
            {t("Temperature preview workspace", "مساحة معاينة درجات الحرارة")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Generate a report to inspect recorded temperature evidence and summary statistics.",
              "أنشئ تقريرًا لفحص أدلة درجات الحرارة المسجلة والإحصاءات الملخصة.",
            )}
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
          {t("Canonical preview", "المعاينة المعتمدة")}
        </Typography>
        <Typography variant="h5">
          {t("Temperature performance", "أداء درجات الحرارة")}
        </Typography>
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
                {csvExporting
                  ? t("Preparing CSV…", "جارٍ إعداد CSV…")
                  : t("Export CSV", "تصدير CSV")}
              </Button>
            ) : null}
            {pdfAvailable ? (
              <Button
                variant="outlined"
                disabled={pdfExporting || csvExporting}
                onClick={onExportPdf}
              >
                {pdfExporting
                  ? t("Preparing PDF…", "جارٍ إعداد PDF…")
                  : t("Export PDF", "تصدير PDF")}
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
            [t("Sensors", "الحساسات"), data.summary.sensors],
            [t("Readings", "القراءات"), data.summary.records],
            [t("Minimum", "الحد الأدنى"), display(data.summary.minimum)],
            [t("Average", "المتوسط"), display(data.summary.average)],
            [t("Maximum", "الحد الأقصى"), display(data.summary.maximum)],
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
          {t(
            "All selected Sensors supplied recorded telemetry.",
            "قدمت جميع الحساسات المحددة قراءات مسجلة.",
          )}
        </Alert>
      ) : (
        <Alert severity="warning">
          {data.quality.warnings.join(" · ") ||
            t(
              "Temperature evidence is incomplete.",
              "أدلة درجات الحرارة غير مكتملة.",
            )}
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
              <TableCell>{t("Sensor", "الحساس")}</TableCell>
              <TableCell>{t("Readings", "القراءات")}</TableCell>
              <TableCell>{t("Minimum", "الحد الأدنى")}</TableCell>
              <TableCell>{t("Average", "المتوسط")}</TableCell>
              <TableCell>{t("Maximum", "الحد الأقصى")}</TableCell>
              <TableCell>{t("Recorded range", "النطاق المسجل")}</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.sensors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6}>
                  {t(
                    "No temperature readings were recorded in this range.",
                    "لم تُسجل قراءات حرارة في هذا النطاق.",
                  )}
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
  reportTitle,
  canExport,
  exporting,
  exportError,
  onExportCsv,
  onExportPdf,
  language,
}: {
  preview: ReturnType<typeof useOperationalReportPreview>;
  reportTitle: string;
  canExport: boolean;
  exporting: boolean;
  exportError: boolean;
  onExportCsv: () => void;
  onExportPdf: () => void;
  language: "en" | "ar";
}) {
  const ar = language === "ar";
  const t = (english: string, arabic: string) => (ar ? arabic : english);
  if (preview.isError)
    return (
      <Alert severity="error">
        {t(
          "The operational report could not be generated.",
          "تعذر إنشاء التقرير التشغيلي.",
        )}
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
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="overline" color="primary.main">
            {reportTitle}
          </Typography>
          <Typography variant="h5">
            {t("Preview workspace", "مساحة المعاينة")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Generate the selected report to display its recorded operational evidence.",
              "أنشئ التقرير المحدد لعرض أدلته التشغيلية المسجلة.",
            )}
          </Typography>
        </Box>
      </Paper>
    );
  const data = preview.data;
  const columns = Array.from(
    new Set(data.records.flatMap((record) => Object.keys(record))),
  );
  return (
    <Stack spacing={3}>
      {exportError ? (
        <Alert severity="error">
          {t(
            "The export could not be downloaded. Check the backend connection and try again.",
            "تعذر تنزيل التصدير. تحقق من اتصال الخادم وحاول مرة أخرى.",
          )}
        </Alert>
      ) : null}
      <Paper variant="outlined" sx={{ p: 4, borderRadius: 4 }}>
        <Typography variant="overline" color="primary.main">
          {t("Canonical preview", "المعاينة المعتمدة")}
        </Typography>
        <Typography variant="h5">
          {data.identity.reportType.replaceAll("-", " ")}
        </Typography>
        <Typography color="text.secondary">
          {data.summary.records} {t("recorded event(s)", "أحداث مسجلة")}
        </Typography>
        {canExport ? (
          <Stack direction="row" spacing={1.5} sx={{ mt: 3 }}>
            <Button
              variant="outlined"
              disabled={exporting}
              onClick={onExportCsv}
            >
              {t("Export CSV", "تصدير CSV")}
            </Button>
            <Button
              variant="outlined"
              disabled={exporting}
              onClick={onExportPdf}
            >
              {t("Export PDF", "تصدير PDF")}
            </Button>
          </Stack>
        ) : null}
      </Paper>
      {data.quality.warnings.length ? (
        <Alert severity="info">{data.quality.warnings.join(" · ")}</Alert>
      ) : (
        <Alert severity="success">
          {t(
            "The selected evidence projection is complete.",
            "عرض الأدلة المحدد مكتمل.",
          )}
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
                  {t(
                    "No records in this range.",
                    "لا توجد سجلات في هذا النطاق.",
                  )}
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
