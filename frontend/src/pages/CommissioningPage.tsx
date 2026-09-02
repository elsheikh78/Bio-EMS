import {
  Alert,
  Box,
  Button,
  Chip,
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
  TextField,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
import { useSites } from "../monitoredAreas/queries";

const copy = {
  en: {
    eyebrow: "Pilot evidence",
    title: "Commissioning",
    description:
      "Review authoritative configuration and calibration blockers before controlled field execution.",
    acceptanceTitle: "Customer installation acceptance",
    acceptanceDescription:
      "This independent customer decision is enabled after SYSTEM_OWNER technical commissioning.",
    installationId: "Installation UUID",
    accept: "Accept",
    reject: "Reject",
    accepted: "Installation accepted.",
    rejected: "Installation rejected.",
    acceptanceError: "The installation decision could not be recorded.",
    site: "Site",
    refresh: "Refresh",
    loadError: "Unable to load commissioning readiness.",
    ready:
      "Software configuration prerequisites are ready. Physical evidence is still required.",
    blocked: (count: number) =>
      `${count} Sensor(s) have blocking prerequisites.`,
    tableLabel: "Commissioning readiness",
    sensor: "Sensor",
    area: "Area",
    deviceChannel: "Device / channel",
    status: "Status",
    blockers: "Blockers",
    readyStatus: "READY",
    blockedStatus: "BLOCKED",
  },
  ar: {
    eyebrow: "أدلة المشروع التجريبي",
    title: "التشغيل المبدئي",
    description:
      "راجع التهيئة المعتمدة وعوائق المعايرة قبل التنفيذ الميداني المحكوم.",
    acceptanceTitle: "قبول العميل للتركيب",
    acceptanceDescription:
      "يصبح قرار العميل المستقل متاحاً بعد اعتماد التشغيل الفني من مالك النظام.",
    installationId: "المعرّف الفريد للتركيب",
    accept: "قبول",
    reject: "رفض",
    accepted: "تم قبول التركيب.",
    rejected: "تم رفض التركيب.",
    acceptanceError: "تعذر تسجيل قرار التركيب.",
    site: "الموقع",
    refresh: "تحديث",
    loadError: "تعذر تحميل جاهزية التشغيل المبدئي.",
    ready:
      "متطلبات تهيئة البرنامج جاهزة، وما زالت الأدلة المادية الفعلية مطلوبة.",
    blocked: (count: number) => `يوجد ${count} حساساً لديه متطلبات مانعة.`,
    tableLabel: "جاهزية التشغيل المبدئي",
    sensor: "الحساس",
    area: "المنطقة",
    deviceChannel: "الجهاز / القناة",
    status: "الحالة",
    blockers: "العوائق",
    readyStatus: "جاهز",
    blockedStatus: "محجوب",
  },
} as const;

type Readiness = {
  ready: boolean;
  summary: {
    totalSensors: number;
    readySensors: number;
    blockedSensors: number;
  };
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

export function CommissioningPage() {
  const { language } = useLocalization();
  const text = copy[language];
  const { protectedRequest, user } = useAuthentication();
  const sites = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<number>();
  const [installationId, setInstallationId] = useState("");
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
      {user?.role === "ADMIN" ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography component="h2" variant="h6">
            {text.acceptanceTitle}
          </Typography>
          <Typography color="text.secondary">
            {text.acceptanceDescription}
          </Typography>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ mt: 2 }}
          >
            <TextField
              label={text.installationId}
              value={installationId}
              onChange={(event) => setInstallationId(event.target.value)}
              fullWidth
            />
            {(["ACCEPT", "REJECT"] as const).map((decision) => (
              <Button
                key={decision}
                variant={decision === "ACCEPT" ? "contained" : "outlined"}
                disabled={!installationId}
                onClick={() =>
                  void protectedRequest(
                    `/installations/${installationId}/acceptance`,
                    {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        decision,
                        note: "Customer ADMIN decision",
                      }),
                    },
                  )
                    .then(() =>
                      setAcceptanceResult(
                        decision === "ACCEPT" ? "accepted" : "rejected",
                      ),
                    )
                    .catch(() => setAcceptanceResult("error"))
                }
              >
                {decision === "ACCEPT" ? text.accept : text.reject}
              </Button>
            ))}
          </Stack>
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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="commissioning-site-label">{text.site}</InputLabel>
          <Select
            labelId="commissioning-site-label"
            label={text.site}
            value={siteId ?? ""}
            onChange={(event) => setSelectedSiteId(Number(event.target.value))}
          >
            {(sites.data ?? []).map((site) => (
              <MenuItem key={site.id} value={site.id}>
                {site.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <Button onClick={() => void readiness.refetch()} disabled={!siteId}>
          {text.refresh}
        </Button>
      </Stack>
      {readiness.isError ? (
        <Alert severity="error">{text.loadError}</Alert>
      ) : null}
      {readiness.data ? (
        <>
          <Alert severity={readiness.data.ready ? "success" : "warning"}>
            {readiness.data.ready
              ? text.ready
              : text.blocked(readiness.data.summary.blockedSensors)}
          </Alert>
          <Paper variant="outlined">
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
          </Paper>
        </>
      ) : null}
    </Stack>
  );
}
