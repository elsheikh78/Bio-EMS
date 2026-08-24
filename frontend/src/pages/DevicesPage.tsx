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
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useAuthentication } from "../auth/useAuthentication";
import { hasPermission } from "../authorization/permissions";
import type { Device } from "../devices/contracts";
import {
  useDeviceHealth,
  useDeviceMutation,
  useDevices,
} from "../devices/queries";

export function DevicesPage() {
  const devices = useDevices();
  const mutation = useDeviceMutation();
  const { user } = useAuthentication();
  const canManage = Boolean(user && hasPermission(user.role, "DEVICE_MANAGE"));
  const [selected, setSelected] = useState<Device | null>(null);
  const [editing, setEditing] = useState<Device | null>(null);
  const health = useDeviceHealth(selected?.device_id ?? null);
  const save = () => {
    if (!editing) return;
    mutation.mutate(
      {
        id: editing.device_id,
        update: {
          device_type: editing.device_type,
          protocol: editing.protocol,
          manufacturer: editing.manufacturer ?? undefined,
          model: editing.model ?? undefined,
          firmware_version: editing.firmware_version ?? undefined,
        },
      },
      { onSuccess: () => setEditing(null) },
    );
  };
  return (
    <Stack spacing={3}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Device registry & health
        </Typography>
        <Typography component="h1" variant="h4">
          Devices
        </Typography>
        <Typography color="text.secondary">
          Review registered controllers, communication health, and controlled
          lifecycle state.
        </Typography>
      </Box>
      <Button
        sx={{ alignSelf: "flex-start" }}
        onClick={() => void devices.refetch()}
      >
        Refresh
      </Button>
      {devices.isPending ? (
        <CircularProgress aria-label="Loading Devices" />
      ) : null}
      {devices.isError ? (
        <Alert
          severity="error"
          action={<Button onClick={() => void devices.refetch()}>Retry</Button>}
        >
          Unable to load Devices.
        </Alert>
      ) : null}
      {mutation.isError ? (
        <Alert severity="error">
          Device update failed or its lifecycle state changed.
        </Alert>
      ) : null}
      {!devices.isPending && !devices.isError && devices.data?.length === 0 ? (
        <Alert severity="info">No Devices are registered.</Alert>
      ) : null}
      {(devices.data ?? []).map((device) => (
        <Paper key={device.device_id} variant="outlined" sx={{ p: 3 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            sx={{ justifyContent: "space-between" }}
          >
            <Box>
              <Typography variant="h6">{device.device_id}</Typography>
              <Typography>
                {device.device_type} · {device.protocol}
              </Typography>
              <Typography color="text.secondary">
                Site #{device.site_id} ·{" "}
                {[device.manufacturer, device.model, device.firmware_version]
                  .filter(Boolean)
                  .join(" · ") || "Metadata unavailable"}
              </Typography>
              <Typography variant="body2">
                Last seen: {device.last_seen_at ?? "Never"}
              </Typography>
            </Box>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Chip
                label={device.status}
                color={
                  device.status === "active"
                    ? "success"
                    : device.status === "disabled"
                      ? "default"
                      : "warning"
                }
              />
              <Button onClick={() => setSelected(device)}>Health</Button>
              {canManage ? (
                <>
                  <Button onClick={() => setEditing(device)}>Edit</Button>
                  {device.status === "active" ? (
                    <Button
                      color="warning"
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: device.device_id,
                          action: "disable",
                        })
                      }
                    >
                      Disable
                    </Button>
                  ) : (
                    <Button
                      disabled={mutation.isPending}
                      onClick={() =>
                        mutation.mutate({
                          id: device.device_id,
                          action: "activate",
                        })
                      }
                    >
                      Activate
                    </Button>
                  )}
                </>
              ) : null}
            </Stack>
          </Stack>
        </Paper>
      ))}
      <Dialog
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        fullWidth
      >
        <DialogTitle>Communication health · {selected?.device_id}</DialogTitle>
        <DialogContent>
          {health.isPending ? <CircularProgress /> : null}
          {health.isError ? (
            <Alert severity="error">Unable to load Device health.</Alert>
          ) : null}
          {health.data ? (
            <Stack spacing={1} sx={{ mt: 1 }}>
              <Chip
                sx={{ alignSelf: "flex-start" }}
                label={health.data.communication_status}
                color={
                  health.data.communication_status === "ONLINE"
                    ? "success"
                    : health.data.communication_status === "OFFLINE"
                      ? "error"
                      : "warning"
                }
              />
              <Typography>
                Last heartbeat: {health.data.last_heartbeat_at ?? "Never"}
              </Typography>
              <Typography>
                Seconds since seen:{" "}
                {health.data.seconds_since_seen ?? "Unavailable"}
              </Typography>
              <Typography variant="body2">
                Stale after {health.data.stale_after_seconds}s · offline after{" "}
                {health.data.offline_after_seconds}s
              </Typography>
            </Stack>
          ) : null}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
      <Dialog
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        fullWidth
      >
        <DialogTitle>Edit Device metadata</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {(
              [
                "device_type",
                "protocol",
                "manufacturer",
                "model",
                "firmware_version",
              ] as const
            ).map((field) => (
              <TextField
                key={field}
                required={field === "device_type" || field === "protocol"}
                label={field.replaceAll("_", " ")}
                value={editing?.[field] ?? ""}
                onChange={(event) =>
                  setEditing((current) =>
                    current
                      ? { ...current, [field]: event.target.value }
                      : current,
                  )
                }
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditing(null)}>Cancel</Button>
          <Button
            disabled={
              !editing?.device_type.trim() ||
              !editing?.protocol.trim() ||
              mutation.isPending
            }
            onClick={save}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}
