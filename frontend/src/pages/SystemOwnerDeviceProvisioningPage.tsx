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
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  useDetectProvisioningBoard,
  useDeviceProvisionerHealth,
  useDeviceProvisioningPorts,
  useDeviceProvisioningTargets,
  useFlashAndBindProvisioningDevice,
  useFlashSimFirmware,
  useSimFlashingHealth,
} from "../device-provisioning/queries";
import { useLocalization } from "../localization/useLocalization";

const copy = {
  en: {
    back: "Back to owner console",
    title: "Device provisioning",
    info: "Connect the ESP32-S3 by USB, detect the controlled COM port, then bind it to an already validated logical Device. BIO-EMS generates and consumes the short-lived pairing credential internally.",
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
    targetTitle: "Flash & Bind",
    target: "Logical Device",
    noTargets: "No installation is waiting for device provisioning.",
    wifiSsid: "Wi-Fi SSID",
    wifiSsidHelp: "Pilot limitation: the SSID must not contain spaces.",
    wifiPassword: "Wi-Fi password",
    platformUrl: "BIO-EMS LAN URL",
    platformUrlHelp:
      "Use the HTTPS LAN address of this BIO-EMS PC, for example https://192.168.1.20. Do not use localhost.",
    credentials:
      "Wi-Fi credentials are used only for this local provisioning transaction and are not written to BIO-EMS audit evidence.",
    flashBind: "Flash & Bind Device",
    flashBinding: "Flashing and binding…",
    success: "Device firmware and platform binding verified.",
    recovered: "Existing active binding recovered and verified.",
    hardwareUid: "Hardware UID",
    bindingId: "Platform binding ID",
    installationActivated:
      "All logical devices are bound. The installation revision is now CONFIG_ACTIVE and its runtime sensor/device inventory has been materialized.",
    moreDevices:
      "This device is bound. Provision the remaining logical Devices before configuration activation.",
    provisionError:
      "Flash & Bind failed. The existing audit/binding state is preserved; retry after correcting the reported condition.",
    simTitle: "SIM-D4 Nano firmware (USB)",
    simInfo:
      "Connect the Nano by USB, select its COM port, and enter the approved firmware version. AVRDUDE writes and verifies it. Disconnect RS485 power while flashing.",
    simUnavailable:
      "SIM firmware or AVR flashing tool is not installed on this station.",
    simVersion: "Approved SIM firmware version",
    simFlash: "Flash and verify SIM",
    simBusy: "Flashing SIM…",
    simSuccess:
      "Firmware written and verified. Test RS485 and sensors separately.",
  },
  ar: {
    back: "العودة إلى لوحة مالك النظام",
    title: "تهيئة وربط الأجهزة",
    info: "وصّل ESP32-S3 عبر USB، واكتشف منفذ COM المعتمد، ثم اربطه بالجهاز المنطقي المحدد مسبقاً. يقوم BIO-EMS بإنشاء واستهلاك كود الربط المؤقت داخلياً بدون نسخه يدوياً.",
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
    targetTitle: "Flash & Bind",
    target: "الجهاز المنطقي",
    noTargets: "لا يوجد تركيب ينتظر تهيئة الأجهزة حالياً.",
    wifiSsid: "اسم شبكة Wi-Fi",
    wifiSsidHelp: "قيد البيلوت الحالي: اسم الشبكة لا يحتوي على مسافات.",
    wifiPassword: "كلمة مرور Wi-Fi",
    platformUrl: "عنوان BIO-EMS على الشبكة المحلية",
    platformUrlHelp:
      "استخدم عنوان HTTPS لهذا الكمبيوتر على الشبكة المحلية، مثال https://192.168.1.20، ولا تستخدم localhost.",
    credentials:
      "بيانات Wi-Fi تُستخدم فقط أثناء عملية التهيئة المحلية الحالية ولا تُكتب في سجل التدقيق الخاص بـBIO-EMS.",
    flashBind: "Flash & Bind للجهاز",
    flashBinding: "جارٍ التفليش والربط…",
    success: "تم التحقق من Firmware وربط الجهاز بالمنصة.",
    recovered: "تم استعادة الربط النشط الموجود والتحقق منه.",
    hardwareUid: "Hardware UID",
    bindingId: "Platform binding ID",
    installationActivated:
      "تم ربط جميع الأجهزة المنطقية. أصبحت مراجعة التركيب CONFIG_ACTIVE وتم إنشاء مخزون الأجهزة والحساسات التشغيلي.",
    moreDevices:
      "تم ربط هذا الجهاز. أكمل تهيئة باقي الأجهزة المنطقية قبل تفعيل التهيئة.",
    provisionError:
      "فشلت عملية Flash & Bind. تم الحفاظ على حالة الربط وسجل التدقيق الحالية؛ صحح السبب ثم أعد المحاولة.",
    simTitle: "فيرموير Nano لوحدة SIM-D4 عبر USB",
    simInfo:
      "وصّل Nano عبر USB واختر منفذ COM وأدخل إصدار الفيرموير المعتمد. ستكتب أداة AVRDUDE البرنامج وتتحقق منه. افصل تغذية RS485 أثناء التفليش.",
    simUnavailable: "فيرموير SIM أو أداة AVR غير مثبتين على هذه المحطة.",
    simVersion: "إصدار فيرموير SIM المعتمد",
    simFlash: "تفليش SIM والتحقق",
    simBusy: "جارٍ تفليش SIM…",
    simSuccess: "تمت الكتابة والتحقق. اختبر RS485 والحساسات بشكل مستقل.",
  },
} as const;

export function SystemOwnerDeviceProvisioningPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const health = useDeviceProvisionerHealth();
  const ports = useDeviceProvisioningPorts();
  const targets = useDeviceProvisioningTargets();
  const detect = useDetectProvisioningBoard();
  const flashBind = useFlashAndBindProvisioningDevice();
  const simHealth = useSimFlashingHealth();
  const simFlash = useFlashSimFirmware();
  const [selectedPort, setSelectedPort] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [wifiSsid, setWifiSsid] = useState("");
  const [wifiPassword, setWifiPassword] = useState("");
  const [platformUrl, setPlatformUrl] = useState(() => {
    const host = window.location.hostname.toLowerCase();
    return host && !["localhost", "127.0.0.1", "::1"].includes(host)
      ? window.location.origin
      : "";
  });

  const inventory = ports.data?.ports ?? [];
  const effectivePort = inventory.some((item) => item.port === selectedPort)
    ? selectedPort
    : inventory.length === 1
      ? inventory[0].port
      : "";

  const targetOptions = (targets.data?.targets ?? []).flatMap((installation) =>
    installation.devices.map((device) => ({
      key: `${installation.installationId}::${device.deviceId}`,
      installationId: installation.installationId,
      customerName: installation.customerName,
      revision: installation.revision,
      ...device,
    })),
  );
  const effectiveTarget =
    targetOptions.find((item) => item.key === selectedTarget) ??
    (targetOptions.length === 1 ? targetOptions[0] : undefined);

  const serviceReady =
    health.data?.status === "UP" &&
    health.data.esptoolReady &&
    health.data.firmwareReady;
  const simReady = Boolean(
    simHealth.data?.toolReady && simHealth.data.firmwareReady,
  );
  const boardReady =
    detect.data?.port === effectivePort && detect.data.supported;
  const formReady =
    Boolean(effectiveTarget) &&
    wifiSsid.length > 0 &&
    !/\s/.test(wifiSsid) &&
    wifiPassword.length >= 8 &&
    platformUrl.length > 0;

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
                {text.tool}:{" "}
                {health.data.esptoolReady ? text.ready : text.unavailable}
              </Typography>
              <Typography>
                {text.firmware}:{" "}
                {health.data.firmwareReady ? text.ready : text.unavailable}
              </Typography>
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
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
          {ports.isError ? (
            <Alert severity="error">{text.unavailable}</Alert>
          ) : null}

          {ports.data ? (
            <Stack spacing={2}>
              <TextField
                disabled={
                  (!serviceReady && !simReady) || ports.data.ports.length === 0
                }
                label={text.select}
                onChange={(event) => {
                  setSelectedPort(event.target.value);
                  detect.reset();
                  flashBind.reset();
                }}
                select
                value={effectivePort}
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
                disabled={!serviceReady || !effectivePort || detect.isPending}
                onClick={() => {
                  flashBind.reset();
                  detect.mutate(effectivePort);
                }}
                variant="contained"
              >
                {detect.isPending ? text.detecting : text.detect}
              </Button>

              {detect.isError ? (
                <Alert severity="error">{text.unavailable}</Alert>
              ) : null}
              {detect.data ? (
                <>
                  <Alert
                    severity={detect.data.supported ? "success" : "warning"}
                  >
                    {detect.data.supported ? text.supported : text.unsupported}
                  </Alert>
                  <Box>
                    <Typography sx={{ fontWeight: 700 }}>
                      {text.output}
                    </Typography>
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
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ mb: 3 }}>
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
            {text.simTitle}
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            {text.simInfo}
          </Alert>
          {!simHealth.data?.toolReady || !simHealth.data.firmwareReady ? (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {text.simUnavailable}
            </Alert>
          ) : null}
          <Stack spacing={2}>
            <Typography>
              {text.simVersion}: {simHealth.data?.firmwareVersion ?? "—"}
            </Typography>
            <Button
              variant="contained"
              disabled={
                !effectivePort ||
                !simHealth.data?.firmwareVersion ||
                !simHealth.data.toolReady ||
                !simHealth.data.firmwareReady ||
                simFlash.isPending
              }
              onClick={() => {
                if (simHealth.data?.firmwareVersion)
                  simFlash.mutate({
                    port: effectivePort,
                    firmwareVersion: simHealth.data.firmwareVersion,
                  });
              }}
            >
              {simFlash.isPending ? text.simBusy : text.simFlash}
            </Button>
            {simFlash.isSuccess ? (
              <Alert severity="success">
                {text.simSuccess} {simFlash.data.firmwareVersion}
              </Alert>
            ) : null}
            {simFlash.isError ? (
              <Alert severity="error">{simFlash.error.message}</Alert>
            ) : null}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography component="h2" variant="h6" sx={{ mb: 2 }}>
            {text.targetTitle}
          </Typography>
          {targets.isPending ? <CircularProgress size={24} /> : null}
          {targets.isError ? (
            <Alert severity="error">{text.unavailable}</Alert>
          ) : null}
          {targets.data && targetOptions.length === 0 ? (
            <Alert severity="info">{text.noTargets}</Alert>
          ) : null}
          {targetOptions.length > 0 ? (
            <Stack spacing={2}>
              <TextField
                label={text.target}
                select
                value={effectiveTarget?.key ?? ""}
                onChange={(event) => {
                  setSelectedTarget(event.target.value);
                  flashBind.reset();
                }}
              >
                {targetOptions.map((item) => (
                  <MenuItem key={item.key} value={item.key}>
                    {item.customerName} — {item.siteName} — {item.deviceId}
                    {item.bound ? " — BOUND" : ""}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label={text.wifiSsid}
                value={wifiSsid}
                onChange={(event) => setWifiSsid(event.target.value)}
                helperText={text.wifiSsidHelp}
                error={wifiSsid.length > 0 && /\s/.test(wifiSsid)}
              />
              <TextField
                label={text.wifiPassword}
                type="password"
                value={wifiPassword}
                onChange={(event) => setWifiPassword(event.target.value)}
              />
              <TextField
                label={text.platformUrl}
                value={platformUrl}
                onChange={(event) => setPlatformUrl(event.target.value)}
                helperText={text.platformUrlHelp}
              />
              <Alert severity="info">{text.credentials}</Alert>
              <Button
                variant="contained"
                disabled={
                  !serviceReady ||
                  !boardReady ||
                  !formReady ||
                  flashBind.isPending
                }
                onClick={() => {
                  if (!effectiveTarget) return;
                  flashBind.mutate({
                    installationId: effectiveTarget.installationId,
                    deviceId: effectiveTarget.deviceId,
                    port: effectivePort,
                    wifiSsid,
                    wifiPassword,
                    platformUrl,
                  });
                }}
              >
                {flashBind.isPending ? text.flashBinding : text.flashBind}
              </Button>
              {flashBind.isError ? (
                <Alert severity="error">{text.provisionError}</Alert>
              ) : null}
              {flashBind.data ? (
                <Stack spacing={1}>
                  <Alert severity="success">
                    {flashBind.data.recoveredExistingBinding
                      ? text.recovered
                      : text.success}
                  </Alert>
                  <Typography>
                    {text.hardwareUid}: {flashBind.data.hardwareUid}
                  </Typography>
                  <Typography>
                    {text.bindingId}: {flashBind.data.platformBindingId}
                  </Typography>
                  <Alert
                    severity={
                      flashBind.data.allDevicesBound ? "success" : "info"
                    }
                  >
                    {flashBind.data.allDevicesBound
                      ? text.installationActivated
                      : text.moreDevices}
                  </Alert>
                </Stack>
              ) : null}
            </Stack>
          ) : null}
        </CardContent>
      </Card>
    </Container>
  );
}
