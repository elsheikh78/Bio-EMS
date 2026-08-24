import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useState } from "react";
import { useSites } from "../monitoredAreas/queries";
import {
  useCreateNotificationRecipient,
  useNotificationRecipients,
  useUpdateNotificationRecipient,
  useUpdateNotificationRecipientStatus,
} from "./queries";
import {
  notificationChannels,
  notificationSeverities,
  recipientRoles,
  type NotificationRecipient,
  type NotificationEndpointInput,
} from "./contracts";

export function NotificationRecipientsPanel() {
  const sitesQuery = useSites();
  const [siteId, setSiteId] = useState<number>();
  const [editing, setEditing] = useState<NotificationRecipient | "new">();
  const effectiveSiteId = siteId ?? sitesQuery.data?.[0]?.id;
  const recipientsQuery = useNotificationRecipients(effectiveSiteId);
  const statusMutation = useUpdateNotificationRecipientStatus(effectiveSiteId);

  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexDirection: { xs: "column", sm: "row" },
          }}
        >
          <Box>
            <Typography component="h2" variant="h5">
              Notification recipients
            </Typography>
            <Typography color="text.secondary">
              Site-scoped contacts and severity eligibility. Contact values are
              never placed in URLs.
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={!effectiveSiteId}
            onClick={() => setEditing("new")}
          >
            Add recipient
          </Button>
        </Box>

        {sitesQuery.isPending ? (
          <CircularProgress aria-label="Loading sites" />
        ) : null}
        {sitesQuery.isError ? (
          <Alert severity="error">Unable to load Sites.</Alert>
        ) : null}
        {(sitesQuery.data?.length ?? 0) > 0 ? (
          <FormControl fullWidth>
            <InputLabel id="recipient-site-label">Site</InputLabel>
            <Select
              labelId="recipient-site-label"
              label="Site"
              value={effectiveSiteId ?? ""}
              onChange={(event) => setSiteId(Number(event.target.value))}
            >
              {sitesQuery.data
                ?.filter((site) => site.id)
                .map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        ) : null}
        {!sitesQuery.isPending &&
        !sitesQuery.isError &&
        sitesQuery.data?.length === 0 ? (
          <Alert severity="info">
            Create a Site before configuring recipients.
          </Alert>
        ) : null}

        {recipientsQuery.isPending && effectiveSiteId ? (
          <CircularProgress aria-label="Loading recipients" />
        ) : null}
        {recipientsQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => void recipientsQuery.refetch()}
              >
                Retry
              </Button>
            }
          >
            Unable to load recipients.
          </Alert>
        ) : null}
        {!recipientsQuery.isPending &&
        !recipientsQuery.isError &&
        effectiveSiteId &&
        recipientsQuery.data?.length === 0 ? (
          <Alert severity="info">
            No notification recipients are configured for this Site.
          </Alert>
        ) : null}
        {statusMutation.isError ? (
          <Alert severity="error">Recipient status could not be changed.</Alert>
        ) : null}
        {recipientsQuery.data?.map((recipient) => (
          <Box
            key={recipient.uuid}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              alignItems: { sm: "center" },
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography component="h3" variant="h6">
                  {recipient.display_name}
                </Typography>
                <Chip
                  size="small"
                  label={recipient.status}
                  color={recipient.status === "active" ? "success" : "default"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={formatEnum(recipient.role)}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {recipient.endpoints
                  .map(
                    (endpoint) =>
                      `${endpoint.channel}: ${endpoint.eligible_severities.join("/")}`,
                  )
                  .join(" · ")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                onClick={() => setEditing(recipient)}
                aria-label={`Edit ${recipient.display_name}`}
              >
                Edit
              </Button>
              <Button
                disabled={statusMutation.isPending}
                color={recipient.status === "active" ? "warning" : "success"}
                onClick={() =>
                  void statusMutation.mutateAsync({
                    uuid: recipient.uuid,
                    status:
                      recipient.status === "active" ? "inactive" : "active",
                  })
                }
              >
                {recipient.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing && effectiveSiteId ? (
        <RecipientDialog
          siteId={effectiveSiteId}
          recipient={editing === "new" ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </Paper>
  );
}

interface RecipientDialogProps {
  siteId: number;
  recipient?: NotificationRecipient;
  onClose: () => void;
}
type EndpointDraft = {
  channel: NotificationEndpointInput["channel"];
  address: string;
  warning: boolean;
  critical: boolean;
};

function RecipientDialog({ siteId, recipient, onClose }: RecipientDialogProps) {
  const createMutation = useCreateNotificationRecipient(siteId);
  const updateMutation = useUpdateNotificationRecipient(siteId);
  const [name, setName] = useState(recipient?.display_name ?? "");
  const [role, setRole] = useState<(typeof recipientRoles)[number]>(
    recipient?.role ?? "PRIMARY_CONTACT",
  );
  const [endpoints, setEndpoints] = useState<EndpointDraft[]>(
    () =>
      recipient?.endpoints.map((endpoint) => ({
        channel: endpoint.channel,
        address: endpoint.address,
        warning: endpoint.eligible_severities.includes("WARNING"),
        critical: endpoint.eligible_severities.includes("CRITICAL"),
      })) ?? [{ channel: "EMAIL", address: "", warning: true, critical: true }],
  );
  const [validation, setValidation] = useState<string>();
  const mutation = recipient ? updateMutation : createMutation;

  function patchEndpoint(index: number, patch: Partial<EndpointDraft>) {
    setEndpoints((current) =>
      current.map((endpoint, position) =>
        position === index ? { ...endpoint, ...patch } : endpoint,
      ),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseRecipient(name, endpoints);
    if (typeof parsed === "string") {
      setValidation(parsed);
      return;
    }
    setValidation(undefined);
    try {
      if (recipient)
        await updateMutation.mutateAsync({
          uuid: recipient.uuid,
          input: { display_name: name.trim(), role, endpoints: parsed },
        });
      else
        await createMutation.mutateAsync({
          uuid: crypto.randomUUID(),
          site_id: siteId,
          display_name: name.trim(),
          role,
          endpoints: parsed,
        });
      onClose();
    } catch {
      /* mutation state renders the error */
    }
  }

  return (
    <Dialog
      open
      fullWidth
      maxWidth="md"
      onClose={mutation.isPending ? undefined : onClose}
    >
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>
          {recipient
            ? `Edit ${recipient.display_name}`
            : "Add notification recipient"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {validation ? <Alert severity="error">{validation}</Alert> : null}
            {mutation.isError ? (
              <Alert severity="error">
                Recipient could not be saved. Contact values were not logged.
              </Alert>
            ) : null}
            <TextField
              required
              label="Display name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <FormControl>
              <InputLabel id="recipient-role-label">Role</InputLabel>
              <Select
                labelId="recipient-role-label"
                label="Role"
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {recipientRoles.map((value) => (
                  <MenuItem key={value} value={value}>
                    {formatEnum(value)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {endpoints.map((endpoint, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <FormControl sx={{ minWidth: 160 }}>
                      <InputLabel id={`channel-${index}-label`}>
                        Channel
                      </InputLabel>
                      <Select
                        labelId={`channel-${index}-label`}
                        label="Channel"
                        value={endpoint.channel}
                        onChange={(event) =>
                          patchEndpoint(index, {
                            channel: event.target.value,
                          })
                        }
                      >
                        {notificationChannels.map((value) => (
                          <MenuItem key={value} value={value}>
                            {value}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField
                      fullWidth
                      required
                      label={`${endpoint.channel} address`}
                      value={endpoint.address}
                      onChange={(event) =>
                        patchEndpoint(index, { address: event.target.value })
                      }
                    />
                    {endpoints.length > 1 ? (
                      <Button
                        color="error"
                        onClick={() =>
                          setEndpoints((current) =>
                            current.filter((_, position) => position !== index),
                          )
                        }
                      >
                        Remove
                      </Button>
                    ) : null}
                  </Stack>
                  <Stack direction="row" spacing={2}>
                    {notificationSeverities.map((severity) => (
                      <FormControlLabel
                        key={severity}
                        control={
                          <Checkbox
                            checked={
                              severity === "WARNING"
                                ? endpoint.warning
                                : endpoint.critical
                            }
                            onChange={(event) =>
                              patchEndpoint(
                                index,
                                severity === "WARNING"
                                  ? { warning: event.target.checked }
                                  : { critical: event.target.checked },
                              )
                            }
                          />
                        }
                        label={formatEnum(severity)}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              disabled={endpoints.length >= 3}
              onClick={() =>
                setEndpoints((current) => [
                  ...current,
                  {
                    channel:
                      notificationChannels.find(
                        (channel) =>
                          !current.some(
                            (endpoint) => endpoint.channel === channel,
                          ),
                      ) ?? "EMAIL",
                    address: "",
                    warning: true,
                    critical: true,
                  },
                ])
              }
            >
              Add channel
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Saving…" : "Save recipient"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function parseRecipient(
  name: string,
  endpoints: EndpointDraft[],
): NotificationEndpointInput[] | string {
  if (!name.trim()) return "Display name is required.";
  if (
    new Set(endpoints.map(({ channel }) => channel)).size !== endpoints.length
  )
    return "Each channel may be configured only once.";
  const parsed: NotificationEndpointInput[] = [];
  for (const endpoint of endpoints) {
    const address = endpoint.address.trim();
    const valid =
      endpoint.channel === "EMAIL"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
        : /^\+[1-9]\d{7,14}$/.test(address);
    if (!valid)
      return endpoint.channel === "EMAIL"
        ? "Email address is invalid."
        : `${endpoint.channel} address must use E.164 format.`;
    const eligible_severities = notificationSeverities.filter((severity) =>
      severity === "WARNING" ? endpoint.warning : endpoint.critical,
    );
    if (eligible_severities.length === 0)
      return "Each channel requires at least one eligible severity.";
    parsed.push({ channel: endpoint.channel, address, eligible_severities });
  }
  return parsed;
}

function formatEnum(value: string) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
