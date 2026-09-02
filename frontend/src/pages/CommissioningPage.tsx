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
import { useSites } from "../monitoredAreas/queries";

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
          Pilot evidence
        </Typography>
        <Typography component="h1" variant="h4">
          Commissioning
        </Typography>
        <Typography color="text.secondary">
          Review authoritative configuration and calibration blockers before
          controlled field execution.
        </Typography>
      </Box>
      {user?.role === "ADMIN" ? (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography component="h2" variant="h6">
            Customer installation acceptance
          </Typography>
          <Typography color="text.secondary">
            This independent customer decision is enabled after SYSTEM_OWNER technical commissioning.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ mt: 2 }}>
            <TextField
              label="Installation UUID"
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
                  void protectedRequest(`/installations/${installationId}/acceptance`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ decision, note: "Customer ADMIN decision" }),
                  })
                    .then(() => setAcceptanceResult(decision === "ACCEPT" ? "accepted" : "rejected"))
                    .catch(() => setAcceptanceResult("error"))
                }
              >
                {decision}
              </Button>
            ))}
          </Stack>
          {acceptanceResult ? (
            <Alert severity={acceptanceResult === "error" ? "error" : "success"} sx={{ mt: 2 }}>
              Installation {acceptanceResult}.
            </Alert>
          ) : null}
        </Paper>
      ) : null}
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
        <FormControl sx={{ minWidth: 240 }}>
          <InputLabel id="commissioning-site-label">Site</InputLabel>
          <Select
            labelId="commissioning-site-label"
            label="Site"
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
          Refresh
        </Button>
      </Stack>
      {readiness.isError ? (
        <Alert severity="error">Unable to load commissioning readiness.</Alert>
      ) : null}
      {readiness.data ? (
        <>
          <Alert severity={readiness.data.ready ? "success" : "warning"}>
            {readiness.data.ready
              ? "Software configuration prerequisites are ready. Physical evidence is still required."
              : `${readiness.data.summary.blockedSensors} Sensor(s) have blocking prerequisites.`}
          </Alert>
          <Paper variant="outlined">
            <Table size="small" aria-label="Commissioning readiness">
              <TableHead>
                <TableRow>
                  <TableCell>Sensor</TableCell>
                  <TableCell>Area</TableCell>
                  <TableCell>Device / channel</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Blockers</TableCell>
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
                        label={item.ready ? "READY" : "BLOCKED"}
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
