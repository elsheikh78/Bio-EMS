import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableContainer,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
import { useSites } from "../monitoredAreas/queries";

const copy = {
  en: {
    eyebrow: "Site acceptance",
    title: "Commissioning & Acceptance",
    description:
      "Review the installed site, live device status and sensor blockers before final customer acceptance.",
    acceptanceTitle: "Customer site acceptance",
    acceptanceDescription:
      "BIO-EMS resolves the installation automatically from the selected Site. No installation identifier needs to be entered.",
    noInstallation: "No installation is currently associated with this Site.",
    lifecycle: "Installation status",
    technical: "Technical commissioning",
    technicalPassed: "Completed by BIO-EMS",
    technicalPending: "Not completed yet",
    accept: "Accept installation",
    reject: "Reject / report issue",
    accepted: "Installation accepted.",
    rejected: "Installation rejected and correction is required.",
    acceptanceError: "The installation decision could not be recorded.",
    acceptanceLocked:
      "Customer acceptance opens after technical commissioning. Acceptance also requires all current commissioning blockers to be cleared.",
    site: "Site",
    refresh: "Refresh",
    loadError: "Unable to load commissioning readiness.",
    ready: "Site evidence is ready for customer acceptance.",
    blocked: (count: number) => `${count} commissioning blocker(s) remain.`,
    tableLabel: "Commissioning readiness",
    sensor: "Sensor",
    area: "Area",
    deviceChannel: "Device / channel",
    status: "Status",
    blockers: "Blockers",
    readyStatus: "READY",
    blockedStatus: "BLOCKED",
    loading: "Loading commissioning readiness",
    noSites: "No Sites are available for commissioning review.",
    totalSensors: "Total Sensors",
    readySensors: "Ready Sensors",
    blockedSensors: "Blocked Sensors",
    devicesOnline: "Devices Online",
    deviceEvidence: "Device communication evidence",
    lastSeen: "Last seen",
    never: "Never",
  },
  ar: {
    eyebrow: "استلام الموقع",
    title: "التشغيل والاستلام",
    description:
      "راجع حالة الموقع والأجهزة والحساسات والعوائق الفعلية قبل الاستلام النهائي من العميل.",
    acceptanceTitle: "استلام العميل للموقع",
    acceptanceDescription:
      "يحدد BIO-EMS التركيب تلقائياً من الموقع المختار، ولا يحتاج العميل إلى إدخال أي Installation UUID.",
    noInstallation: "لا يوجد تركيب مرتبط بهذا الموقع حالياً.",
    lifecycle: "حالة التركيب",
    technical: "التشغيل الفني",
    technicalPassed: "تم اعتماده بواسطة BIO-EMS",
    technicalPending: "لم يكتمل بعد",
    accept: "قبول التركيب",
    reject: "رفض / تسجيل مشكلة",
    accepted: "تم قبول التركيب.",
    rejected: "تم رفض التركيب ويجب تنفيذ التصحيح.",
    acceptanceError: "تعذر تسجيل قرار الاستلام.",
    acceptanceLocked:
      "يتاح استلام العميل بعد إتمام التشغيل الفني. كما يتطلب القبول عدم وجود أي عوائق تشغيل حالية.",
    site: "الموقع",
    refresh: "تحديث",
    loadError: "تعذر تحميل جاهزية التشغيل والاستلام.",
    ready: "أدلة الموقع جاهزة لاستلام العميل.",
    blocked: (count: number) => `ما زال هناك ${count} عائق تشغيل.`,
    tableLabel: "جاهزية التشغيل والاستلام",
    sensor: "الحساس",
    area: "المنطقة",
    deviceChannel: "الجهاز / القناة",
    status: "الحالة",
    blockers: "العوائق",
    readyStatus: "جاهز",
    blockedStatus: "محجوب",
    loading: "جارٍ تحميل جاهزية التشغيل والاستلام",
    noSites: "لا توجد مواقع متاحة لمراجعة التشغيل والاستلام.",
    totalSensors: "إجمالي الحساسات",
    readySensors: "الحساسات الجاهزة",
    blockedSensors: "الحساسات المحجوبة",
    devicesOnline: "الأجهزة المتصلة",
    deviceEvidence: "أدلة اتصال الأجهزة",
    lastSeen: "آخر اتصال",
    never: "لم يتصل",
  },
} as const;

type Readiness = {
  ready: boolean;
  summary: {
    totalSensors: number;
    readySensors: number;
    blockedSensors: number;
    totalDevices: number;
    onlineDevices: number;
    blockedDevices: number;
  };
  devices: Array<{
    deviceId: string;
    communicationStatus: string;
    lastSeenAt: string | null;
    ready: boolean;
    blockers: string[];
  }>;
  items: Array<{
    sensorId: number;
    sensorCode: string;
    roomCode: string;
    deviceIdentity: string;
    channel: number;
    ready: boolean;
    blockers: string[];
  }>;
};

type AcceptanceState = {
  siteId: number;
  siteCode: string;
  siteName: string;
  installation: null | {
    uuid: string;
    status: string;
    latestRevision: number;
    acceptanceEnabled: boolean;
    technicalCommissioning: null | {
      decision: string;
      decidedAt: string;
    };
    customerAcceptance: null | {
      decision: string;
      decidedAt: string;
    };
  };
};

export function CommissioningPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const { protectedRequest, user } = useAuthentication();
  const sites = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number>();
  const [acceptanceResult, setAcceptanceResult] = useState<
    "accepted" | "rejected" | "error"
  >();
  const siteId = selectedSiteId ?? sites.data?.[0]?.id;

  const readiness = useQuery({
    queryKey: ["commissioning", "readiness", siteId],
    queryFn: () =>
      protectedRequest<Readiness>(`/sites/${siteId}/commissioning-readiness`),
    enabled: Boolean(siteId),
  });

  const acceptance = useQuery({
    queryKey: ["commissioning", "acceptance-state", siteId],
    queryFn: () =>
      protectedRequest<AcceptanceState>(
        `/installations/site/${siteId}/acceptance-state`,
      ),
    enabled: Boolean(siteId),
  });

  const installation = acceptance.data?.installation ?? null;
  const technicalPassed =
    installation?.technicalCommissioning?.decision === "ACCEPT";
  const acceptanceStageOpen =
    installation?.status === "CUSTOMER_ACCEPTANCE_PENDING" && technicalPassed;
  const canAccept = Boolean(
    user?.role === "ADMIN" && acceptanceStageOpen && readiness.data?.ready,
  );
  const canReject = Boolean(user?.role === "ADMIN" && acceptanceStageOpen);
  const blockerCount =
    (readiness.data?.summary.blockedSensors ?? 0) +
    (readiness.data?.summary.blockedDevices ?? 0);

  const decide = async (decision: "ACCEPT" | "REJECT") => {
    if (!installation) return;
    setAcceptanceResult(undefined);
    try {
      await protectedRequest(`/installations/${installation.uuid}/acceptance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision,
          note:
            decision === "ACCEPT"
              ? "Customer ADMIN site acceptance"
              : "Customer ADMIN rejected site acceptance",
        }),
      });
      setAcceptanceResult(decision === "ACCEPT" ? "accepted" : "rejected");
      await Promise.all([acceptance.refetch(), readiness.refetch()]);
    } catch {
      setAcceptanceResult("error");
    }
  };

  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {text.eyebrow}
        </Typography>
        <Typography component="h1" variant="h4">
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.description}</Typography>
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: "action.hover", p: 2 }}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
          <FormControl sx={{ minWidth: 240 }}>
            <InputLabel id="commissioning-site-label">{text.site}</InputLabel>
            <Select
              labelId="commissioning-site-label"
              label={text.site}
              value={siteId ?? ""}
              onChange={(event) => {
                setSelectedSiteId(Number(event.target.value));
                setAcceptanceResult(undefined);
              }}
            >
              {(sites.data ?? []).map((site) => (
                <MenuItem key={site.id} value={site.id}>
                  {site.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="outlined"
            onClick={() => {
              void readiness.refetch();
              void acceptance.refetch();
            }}
            disabled={!siteId || readiness.isFetching || acceptance.isFetching}
          >
            {text.refresh}
          </Button>
        </Stack>
      </Paper>

      {sites.isPending || readiness.isPending || acceptance.isPending ? (
        <Box
          role="status"
          sx={{ alignItems: "center", display: "flex", gap: 2 }}
        >
          <CircularProgress size={24} />
          <Typography>{text.loading}</Typography>
        </Box>
      ) : null}

      {!sites.isPending && !sites.isError && (sites.data?.length ?? 0) === 0 ? (
        <Alert severity="info">{text.noSites}</Alert>
      ) : null}
      {readiness.isError || acceptance.isError ? (
        <Alert severity="error">{text.loadError}</Alert>
      ) : null}

      {readiness.data ? (
        <>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(4, minmax(0, 1fr))",
              },
            }}
          >
            {[
              [
                text.totalSensors,
                readiness.data.summary.totalSensors,
                "primary.main",
              ],
              [
                text.readySensors,
                readiness.data.summary.readySensors,
                "success.main",
              ],
              [
                text.blockedSensors,
                readiness.data.summary.blockedSensors,
                "warning.main",
              ],
              [
                text.devicesOnline,
                `${readiness.data.summary.onlineDevices}/${readiness.data.summary.totalDevices}`,
                readiness.data.summary.blockedDevices === 0
                  ? "success.main"
                  : "warning.main",
              ],
            ].map(([label, value, color]) => (
              <Paper
                key={String(label)}
                variant="outlined"
                sx={{
                  borderInlineStart: 5,
                  borderInlineStartColor: color,
                  p: 2,
                }}
              >
                <Typography color="text.secondary" variant="body2">
                  {label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color,
                    fontWeight: 800,
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {value}
                </Typography>
              </Paper>
            ))}
          </Box>

          <Alert severity={readiness.data.ready ? "success" : "warning"}>
            {readiness.data.ready ? text.ready : text.blocked(blockerCount)}
          </Alert>

          <Paper variant="outlined" sx={{ p: 2 }}>
            <Typography component="h2" variant="h6" sx={{ mb: 1 }}>
              {text.deviceEvidence}
            </Typography>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              {readiness.data.devices.map((device) => (
                <Chip
                  key={device.deviceId}
                  color={device.ready ? "success" : "warning"}
                  label={`${device.deviceId}: ${device.communicationStatus} · ${text.lastSeen}: ${
                    device.lastSeenAt
                      ? new Date(device.lastSeenAt).toLocaleString()
                      : text.never
                  }`}
                />
              ))}
            </Stack>
          </Paper>

          <TableContainer component={Paper} variant="outlined">
            <Table size="small" aria-label={text.tableLabel}>
              <TableHead>
                <TableRow>
                  <TableCell>{text.sensor}</TableCell>
                  <TableCell>{text.area}</TableCell>
                  <TableCell>{text.deviceChannel}</TableCell>
                  <TableCell>{text.status}</TableCell>
                  <TableCell>{text.blockers}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {readiness.data.items.map((item) => (
                  <TableRow key={item.sensorId}>
                    <TableCell>{item.sensorCode}</TableCell>
                    <TableCell>{item.roomCode}</TableCell>
                    <TableCell>
                      {item.deviceIdentity} / {item.channel}
                    </TableCell>
                    <TableCell>
                      <Chip
                        size="small"
                        color={item.ready ? "success" : "warning"}
                        label={
                          item.ready ? text.readyStatus : text.blockedStatus
                        }
                      />
                    </TableCell>
                    <TableCell>{item.blockers.join(", ") || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      ) : null}

      {user?.role === "ADMIN" ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography component="h2" variant="h6">
            {text.acceptanceTitle}
          </Typography>
          <Typography color="text.secondary">
            {text.acceptanceDescription}
          </Typography>

          {!installation ? (
            <Alert severity="info" sx={{ mt: 2 }}>
              {text.noInstallation}
            </Alert>
          ) : (
            <Stack spacing={2} sx={{ mt: 2 }}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Chip
                  label={`${text.lifecycle}: ${installation.status}`}
                  color={
                    installation.status === "COMMISSIONED"
                      ? "success"
                      : installation.status === "CORRECTION_REQUIRED"
                        ? "warning"
                        : "default"
                  }
                />
                <Chip
                  label={`${text.technical}: ${
                    technicalPassed
                      ? text.technicalPassed
                      : text.technicalPending
                  }`}
                  color={technicalPassed ? "success" : "default"}
                />
              </Stack>

              {!acceptanceStageOpen &&
              installation.status !== "COMMISSIONED" &&
              installation.status !== "CORRECTION_REQUIRED" ? (
                <Alert severity="info">{text.acceptanceLocked}</Alert>
              ) : null}

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  disabled={!canAccept}
                  onClick={() => void decide("ACCEPT")}
                >
                  {text.accept}
                </Button>
                <Button
                  variant="outlined"
                  color="warning"
                  disabled={!canReject}
                  onClick={() => void decide("REJECT")}
                >
                  {text.reject}
                </Button>
              </Stack>
            </Stack>
          )}

          {acceptanceResult ? (
            <Alert
              severity={acceptanceResult === "error" ? "error" : "success"}
              sx={{ mt: 2 }}
            >
              {acceptanceResult === "accepted"
                ? text.accepted
                : acceptanceResult === "rejected"
                  ? text.rejected
                  : text.acceptanceError}
            </Alert>
          ) : null}
        </Paper>
      ) : null}
    </Stack>
  );
}
