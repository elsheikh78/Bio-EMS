import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  useDetectProvisioningBoard,
  useDeviceProvisionerHealth,
  useDeviceProvisioningPorts,
} from "../device-provisioning/queries";
import { useLocalization } from "../localization/useLocalization";

const copy = {
  en: {
    back: "Back to owner console",
    title: "Device provisioning",
    info: "Connect the ESP32-S3 by USB. BIO-EMS detects the controlled COM port and board before any firmware write. Flash & Bind remains gated until the one-click provisioning transaction is complete.",
    service: "Local provisioning service",
    status: "Status",
    ready: "Ready",
    unavailable: "Unavailable",
    tool: "Espressif flashing tool",
    firmware: "Governed Pilot firmware",
    ports: "Connected serial devices",
    refresh: "Refresh",
    select: "COM port",
    none: "No serial device detected",
    detect: "Detect ESP32-S3",
    detecting: "Detecting…",
    supported: "Supported ESP32-S3 detected",
    unsupported: "The selected port is not a supported ESP32-S3.",
    output: "Detection evidence",
    dp02:
      "Next gate: Flash & Provision will automate firmware flashing, hardware UID capture and short-lived platform binding without asking the operator to copy the 12-digit pairing code.",
  },
  ar: {
    back: "العودة إلى لوحة مالك النظام",
    title: "تهيئة وربط الأجهزة",
    info: "وصّل ESP32-S3 عبر USB. يقوم BIO-EMS باكتشاف منفذ COM واللوحة قبل أي كتابة للـFirmware. يظل Flash & Bind محجوباً حتى يكتمل مسار التهيئة والربط بضغطة واحدة.",
    service: "خدمة تهيئة الأجهزة المحلية",
    status: "الحالة",
    ready: "جاهزة",
    unavailable: "غير متاحة",
    tool: "أداة تفليش Espressif",
    firmware: "Firmware البيلوت المعتمد",
    ports: "أجهزة Serial المتصلة",
    refresh: "تحديث",
    select: "منفذ COM",
    none: "لا يوجد جهاز Serial مكتشف",
    detect: "اكتشاف ESP32-S3",
    detecting: "جارٍ الاكتشاف…",
    supported: "تم اكتشاف ESP32-S3 مدعومة",
    unsupported: "المنفذ المحدد لا يحتوي على ESP32-S3 مدعومة.",
    output: "دليل الاكتشاف",
    dp02:
      "البوابة التالية: Flash & Provision ستنفذ تفليش الـFirmware وقراءة Hardware UID والربط المؤقت بالمنصة تلقائياً بدون نسخ كود الـ12 رقماً يدوياً.",
  },
} as const;

export function SystemOwnerDeviceProvisioningPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const health = useDeviceProvisionerHealth();
  const ports = useDeviceProvisioningPorts();
  const detect = useDetectProvisioningBoard();
  const [selectedPort, setSelectedPort] = useState("");

  useEffect(() => {
    const inventory = ports.data?.ports ?? [];
    if (inventory.length === 1 && !selectedPort) {
      setSelectedPort(inventory[0].port);
    }
    if (selectedPort && !inventory.some((item) => item.port === selectedPort)) {
      setSelectedPort("");
      detect.reset();
    }
  }, [ports.data, selectedPort, detect]);

  const serviceReady =
    health.data?.status === "UP" &&
    health.data.esptoolReady &&
    health.data.firmwareReady;

  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <Button component={Link} to="/system-owner">
        {text.back}
      </Button>
      <Typography component="h1" variant="h4" sx={{ my: 2 }}>
        {text.title}
      </Typography>
      <Alert severity="info" sx={{ mb: 3 }}>
        {text.info}
      </Alert>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            {text.service}
          </Typography>
          {health.isPending ? <CircularProgress size={24} /> : null}
          {health.isError ? (
            <Alert severity="error">{text.unavailable}</Alert>
          ) : null}
          {health.data ? (
            <Stack spacing={1}>
              <Typography>
                {text.status}: {serviceReady ? text.ready : text.unavailable}
              </Typography>
              <Typography>
                {text.tool}: {health.data.esptoolReady ? text.ready : text.unavailable}
              </Typography>
              <Typography>
                {text.firmware}: {health.data.firmwareReady ? text.ready : text.unavailable}
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Box
            sx={{
              alignItems: "center",
              display: "flex",
              justifyContent: "space-between",
              mb: 2,
            }}
          >
            <Typography component="h2" variant="h6">
              {text.ports}
            </Typography>
            <Button
              disabled={ports.isFetching}
              onClick={() => void ports.refetch()}
            >
              {text.refresh}
            </Button>
          </Box>

          {ports.isPending ? <CircularProgress size={24} /> : null}
          {ports.isError ? <Alert severity="error">{text.unavailable}</Alert> : null}

          {ports.data ? (
            <Stack spacing={2}>
              <TextField
                disabled={!serviceReady || ports.data.ports.length === 0}
                label={text.select}
                onChange={(event) => {
                  setSelectedPort(event.target.value);
                  detect.reset();
                }}
                select
                value={selectedPort}
              >
                {ports.data.ports.length === 0 ? (
                  <MenuItem disabled value="">
                    {text.none}
                  </MenuItem>
                ) : null}
                {ports.data.ports.map((item) => (
                  <MenuItem key={item.port} value={item.port}>
                    {item.port}
                    {item.name ? ` — ${item.name}` : ""}
                  </MenuItem>
                ))}
              </TextField>

              <Button
                disabled={!serviceReady || !selectedPort || detect.isPending}
                onClick={() => detect.mutate(selectedPort)}
                variant="contained"
              >
                {detect.isPending ? text.detecting : text.detect}
              </Button>

              {detect.isError ? (
                <Alert severity="error">{text.unavailable}</Alert>
              ) : null}
              {detect.data ? (
                <>
                  <Alert severity={detect.data.supported ? "success" : "warning"}>
                    {detect.data.supported ? text.supported : text.unsupported}
                  </Alert>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>{text.output}</Typography>
                    <Typography
                      component="pre"
                      sx={{
                        bgcolor: "action.hover",
                        borderRadius: 1,
                        mt: 1,
                        overflowX: "auto",
                        p: 2,
                        whiteSpace: "pre-wrap",
                      }}
                      variant="body2"
                    >
                      {detect.data.toolOutput}
                    </Typography>
                  </Box>
                </>
              ) : null}

              <Alert severity="warning">{text.dp02}</Alert>
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
}
