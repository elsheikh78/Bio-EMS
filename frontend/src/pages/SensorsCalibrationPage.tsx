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
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";
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
  const { language } = useLocalization();
  const text = sensorCopy[language];
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
            {text.eyebrow}
          </Typography>
          <Typography component="h1" variant="h4">
            {text.title}
          </Typography>
          <Typography color="text.secondary">{text.description}</Typography>
        </Box>
        <Button variant="outlined" onClick={() => void query.refetch()}>
          {text.refresh}
        </Button>
      </Stack>

      <Box
        component="section"
        aria-label={text.summaryLabel}
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
        <Metric
          label={text.status.VALID}
          value={counts.VALID}
          tone="success.main"
        />
        <Metric
          label={text.status.DUE}
          value={counts.DUE}
          tone="warning.main"
        />
        <Metric
          label={text.status.EXPIRED}
          value={counts.EXPIRED}
          tone="error.main"
        />
        <Metric
          label={text.status.NOT_CALIBRATED}
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
                {text.register}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {text.shown(sensors.length, allSensors.length)}
              </Typography>
            </Box>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <TextField
                size="small"
                label={text.search}
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                sx={{ minWidth: 230 }}
              />
              <FormControl size="small" sx={{ minWidth: 165 }}>
                <InputLabel id="status-filter-label">
                  {text.statusLabel}
                </InputLabel>
                <Select
                  labelId="status-filter-label"
                  label={text.statusLabel}
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                >
                  <MenuItem value="ALL">{text.allStatuses}</MenuItem>
                  {calibrationOrder.map((status) => (
                    <MenuItem key={status} value={status}>
                      {formatStatus(status, language)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 155 }}>
                <InputLabel id="type-filter-label">
                  {text.sensorType}
                </InputLabel>
                <Select
                  labelId="type-filter-label"
                  label={text.sensorType}
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                >
                  <MenuItem value="ALL">{text.allTypes}</MenuItem>
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
              <Typography>{text.loading}</Typography>
            </Stack>
          ) : query.isError ? (
            <Alert
              severity="error"
              action={
                <Button color="inherit" onClick={() => void query.refetch()}>
                  {text.retry}
                </Button>
              }
            >
              {text.loadError}
            </Alert>
          ) : sensors.length === 0 ? (
            <Alert severity="info">{text.empty}</Alert>
          ) : (
            <TableContainer>
              <Table
                aria-label={text.tableLabel}
                sx={{ "& .MuiTableCell-root": { fontSize: "0.84rem" } }}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>{text.sensor}</TableCell>
                    <TableCell>{text.typeHardware}</TableCell>
                    <TableCell>{text.statusLabel}</TableCell>
                    <TableCell>{text.lastCalibrated}</TableCell>
                    <TableCell>{text.dueDate}</TableCell>
                    <TableCell>{text.certificate}</TableCell>
                    <TableCell align="right">{text.actions}</TableCell>
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
                          {sensor.hardware_model ?? text.noHardware}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <StatusChip
                          status={sensor.calibration_status ?? "NOT_CALIBRATED"}
                          language={language}
                        />
                      </TableCell>
                      <TableCell>
                        {formatDate(sensor.last_calibrated_at, language)}
                      </TableCell>
                      <TableCell>
                        {formatDate(sensor.calibration_due_at, language)}
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
                            {text.history}
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
                              {text.record}
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
        language={language}
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
  language,
  onClose,
  onRecord,
}: {
  sensor?: Sensor;
  recording: boolean;
  canWrite: boolean;
  language: "en" | "ar";
  onClose: () => void;
  onRecord: () => void;
}) {
  const text = sensorCopy[language];
  const history = useCalibrationHistory(sensor?.uuid);
  const mutation = useCreateCalibrationRecord(sensor?.uuid);
  const [result, setResult] = useState<"PASS" | "FAIL">("PASS");
  const [validationError, setValidationError] = useState<string>();

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
    setValidationError(undefined);
    mutation.reset();
    const certificate = field("certificate_reference").trim();
    const notes = field("notes").trim();
    if (result === "PASS") {
      payload.due_at = new Date(field("due_at")).toISOString();
      payload.offset = Number(field("offset"));
      if (Date.parse(payload.due_at) <= Date.parse(payload.performed_at)) {
        setValidationError(text.dueValidation);
        return;
      }
    }
    if (certificate) payload.certificate_reference = certificate;
    if (notes) payload.notes = notes;
    await mutation.mutateAsync(payload);
  }

  return (
    <Dialog open={Boolean(sensor)} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {recording ? text.recordCalibration : text.calibrationHistory}
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
                    <Alert severity="error">{text.saveError}</Alert>
                  )}
                  {validationError && (
                    <Alert severity="warning">{validationError}</Alert>
                  )}
                  {mutation.isSuccess && (
                    <Alert severity="success">{text.saveSuccess}</Alert>
                  )}
                  <FormControl fullWidth>
                    <InputLabel id="result-label">{text.result}</InputLabel>
                    <Select
                      labelId="result-label"
                      label={text.result}
                      value={result}
                      onChange={(event) => setResult(event.target.value)}
                    >
                      <MenuItem value="PASS">{text.pass}</MenuItem>
                      <MenuItem value="FAIL">{text.fail}</MenuItem>
                    </Select>
                  </FormControl>
                  <TextField
                    name="performed_at"
                    label={text.performedAt}
                    type="datetime-local"
                    required
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                  {result === "PASS" && (
                    <>
                      <TextField
                        name="due_at"
                        label={text.nextDue}
                        type="datetime-local"
                        required
                        slotProps={{ inputLabel: { shrink: true } }}
                      />
                      <TextField
                        name="offset"
                        label={`${text.offset} (${sensor.unit})`}
                        type="number"
                        required
                        slotProps={{ htmlInput: { step: "any" } }}
                      />
                    </>
                  )}
                  <TextField
                    name="certificate_reference"
                    label={text.certificateReference}
                    slotProps={{ htmlInput: { maxLength: 200 } }}
                  />
                  <TextField
                    name="notes"
                    label={text.notes}
                    multiline
                    minRows={3}
                    slotProps={{ htmlInput: { maxLength: 2000 } }}
                  />
                </Stack>
              </Box>
            ) : history.isPending ? (
              <CircularProgress size={24} />
            ) : history.isError ? (
              <Alert severity="error">{text.historyError}</Alert>
            ) : history.data?.length ? (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>{text.result}</TableCell>
                    <TableCell>{text.performed}</TableCell>
                    <TableCell>{text.due}</TableCell>
                    <TableCell>{text.certificate}</TableCell>
                    <TableCell>{text.performedBy}</TableCell>
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
                      <TableCell>
                        {formatDate(record.performed_at, language)}
                      </TableCell>
                      <TableCell>
                        {formatDate(record.due_at, language)}
                      </TableCell>
                      <TableCell>
                        {record.certificate_reference ?? "—"}
                      </TableCell>
                      <TableCell>{record.performed_by_username}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <Alert severity="info">{text.noHistory}</Alert>
            )}
          </Stack>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{text.close}</Button>
        {!recording && canWrite && (
          <Button variant="contained" onClick={onRecord}>
            {text.recordCalibration}
          </Button>
        )}
        {recording && (
          <Button
            type="submit"
            form="calibration-form"
            variant="contained"
            disabled={mutation.isPending}
          >
            {text.saveCalibration}
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

function StatusChip({
  status,
  language,
}: {
  status: CalibrationStatus;
  language: "en" | "ar";
}) {
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
      label={formatStatus(status, language)}
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

function formatStatus(status: string, language: "en" | "ar") {
  const translated = sensorCopy[language].status[status as CalibrationStatus];
  return translated ?? status.replaceAll("_", " ");
}
function formatDate(value: string | null | undefined, language: "en" | "ar") {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(date);
}

const sensorCopy = {
  en: {
    eyebrow: "Asset quality / Calibration control",
    title: "Sensors & Calibration",
    description:
      "Traceable sensor identity, calibration status, and audit evidence.",
    refresh: "Refresh register",
    summaryLabel: "Calibration summary",
    register: "Calibration register",
    shown: (shown: number, total: number) =>
      `${shown} of ${total} sensors shown`,
    search: "Search sensors",
    statusLabel: "Status",
    allStatuses: "All statuses",
    sensorType: "Sensor type",
    allTypes: "All types",
    loading: "Loading sensors and calibration status",
    retry: "Retry",
    loadError: "Sensors and calibration status could not be loaded.",
    empty: "No sensors match the current filters.",
    tableLabel: "Sensor calibration register",
    sensor: "Sensor",
    typeHardware: "Type / hardware",
    lastCalibrated: "Last calibrated",
    dueDate: "Due date",
    certificate: "Certificate",
    actions: "Actions",
    noHardware: "Hardware not recorded",
    history: "History",
    record: "Record",
    dueValidation:
      "Next calibration due must be later than the performed date and time.",
    recordCalibration: "Record calibration",
    calibrationHistory: "Calibration history",
    saveError: "Calibration record could not be saved.",
    saveSuccess: "Calibration record saved and register refreshed.",
    result: "Result",
    pass: "Pass",
    fail: "Fail",
    performedAt: "Performed at",
    nextDue: "Next calibration due",
    offset: "Measured offset",
    certificateReference: "Certificate reference",
    notes: "Notes",
    historyError: "Calibration history could not be loaded.",
    performed: "Performed",
    due: "Due",
    performedBy: "Performed by",
    noHistory: "No calibration history has been recorded.",
    close: "Close",
    saveCalibration: "Save calibration",
    status: {
      VALID: "Valid",
      DUE: "Due",
      EXPIRED: "Expired",
      NOT_CALIBRATED: "Not calibrated",
    },
  },
  ar: {
    eyebrow: "جودة الأصول / ضبط المعايرة",
    title: "الحساسات والمعايرة",
    description: "هوية حساسات قابلة للتتبع، وحالة المعايرة، وأدلة التدقيق.",
    refresh: "تحديث السجل",
    summaryLabel: "ملخص المعايرة",
    register: "سجل المعايرة",
    shown: (shown: number, total: number) => `معروض ${shown} من ${total} حساس`,
    search: "البحث في الحساسات",
    statusLabel: "الحالة",
    allStatuses: "كل الحالات",
    sensorType: "نوع الحساس",
    allTypes: "كل الأنواع",
    loading: "جارٍ تحميل الحساسات وحالة المعايرة",
    retry: "إعادة المحاولة",
    loadError: "تعذر تحميل الحساسات وحالة المعايرة.",
    empty: "لا توجد حساسات تطابق عوامل التصفية الحالية.",
    tableLabel: "سجل معايرة الحساسات",
    sensor: "الحساس",
    typeHardware: "النوع / المكونات",
    lastCalibrated: "آخر معايرة",
    dueDate: "تاريخ الاستحقاق",
    certificate: "الشهادة",
    actions: "الإجراءات",
    noHardware: "المكونات غير مسجلة",
    history: "السجل",
    record: "تسجيل",
    dueValidation:
      "يجب أن يكون موعد المعايرة التالية بعد تاريخ ووقت إجراء المعايرة.",
    recordCalibration: "تسجيل معايرة",
    calibrationHistory: "سجل المعايرة",
    saveError: "تعذر حفظ سجل المعايرة.",
    saveSuccess: "تم حفظ سجل المعايرة وتحديث القائمة.",
    result: "النتيجة",
    pass: "ناجح",
    fail: "راسب",
    performedAt: "وقت الإجراء",
    nextDue: "موعد المعايرة التالية",
    offset: "الانحراف المقاس",
    certificateReference: "مرجع الشهادة",
    notes: "ملاحظات",
    historyError: "تعذر تحميل سجل المعايرة.",
    performed: "أُجريت في",
    due: "الاستحقاق",
    performedBy: "أجراها",
    noHistory: "لم يتم تسجيل أي معايرات.",
    close: "إغلاق",
    saveCalibration: "حفظ المعايرة",
    status: {
      VALID: "سارية",
      DUE: "مستحقة",
      EXPIRED: "منتهية",
      NOT_CALIBRATED: "غير معاير",
    },
  },
} as const;
