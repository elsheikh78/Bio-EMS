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
  notificationChannels,
  notificationSeverities,
  recipientRoles,
  type EscalationPolicy,
  type EscalationStepInput,
} from "./contracts";
import {
  useCreateEscalationPolicy,
  useEscalationPolicies,
  useUpdateEscalationPolicy,
  useUpdateEscalationPolicyStatus,
} from "./queries";

export function EscalationPoliciesPanel() {
  const sites = useSites();
  const [selectedSite, setSelectedSite] = useState<number>();
  const siteId = selectedSite;
  const policies = useEscalationPolicies(siteId);
  const status = useUpdateEscalationPolicyStatus(siteId);
  const [editing, setEditing] = useState<EscalationPolicy | "new">();
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
              Escalation policies
            </Typography>
            <Typography color="text.secondary">
              Ordered, Site-scoped notification steps with strictly increasing
              elapsed delays.
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={!siteId}
            onClick={() => setEditing("new")}
          >
            Add policy
          </Button>
        </Box>
        {sites.isPending ? (
          <CircularProgress aria-label="Loading policy Sites" />
        ) : null}
        {sites.isError ? (
          <Alert severity="error">
            Unable to load Sites for escalation policies.
          </Alert>
        ) : null}
        {(sites.data?.length ?? 0) > 0 ? (
          <FormControl fullWidth>
            <InputLabel id="policy-site-label">Policy Site</InputLabel>
            <Select
              labelId="policy-site-label"
              label="Policy Site"
              value={siteId ?? ""}
              onChange={(event) => setSelectedSite(Number(event.target.value))}
            >
              <MenuItem value="" disabled>
                Select a Site
              </MenuItem>
              {sites.data
                ?.filter((site) => site.id)
                .map((site) => (
                  <MenuItem key={site.id} value={site.id}>
                    {site.name} ({site.code})
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
        ) : null}
        {!sites.isPending && !sites.isError && sites.data?.length === 0 ? (
          <Alert severity="info">
            Create a Site before configuring escalation policies.
          </Alert>
        ) : null}
        {!sites.isPending &&
        !sites.isError &&
        !siteId &&
        (sites.data?.length ?? 0) > 0 ? (
          <Alert severity="info">
            Select a Site before loading or changing escalation policies.
          </Alert>
        ) : null}
        {policies.isPending && siteId ? (
          <CircularProgress aria-label="Loading escalation policies" />
        ) : null}
        {policies.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void policies.refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load escalation policies.
          </Alert>
        ) : null}
        {!policies.isPending &&
        !policies.isError &&
        siteId &&
        policies.data?.length === 0 ? (
          <Alert severity="info">
            No escalation policies are configured for this Site.
          </Alert>
        ) : null}
        {status.isError ? (
          <Alert severity="error">Policy status could not be changed.</Alert>
        ) : null}
        {policies.data?.map((policy) => (
          <Box
            key={policy.uuid}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
              alignItems: { sm: "center" },
            }}
          >
            <Box>
              <Stack
                direction="row"
                spacing={1}
                sx={{ alignItems: "center", flexWrap: "wrap" }}
              >
                <Typography component="h3" variant="h6">
                  {policy.name}
                </Typography>
                <Chip
                  size="small"
                  label={policy.status}
                  color={policy.status === "active" ? "success" : "default"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${policy.steps.length} steps`}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Owner: {formatEnum(policy.owner_role)} ·{" "}
                {policy.eligible_severities.join("/")} · Delays:{" "}
                {policy.steps
                  .map((step) => `${step.delay_seconds}s`)
                  .join(" → ")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                aria-label={`Edit ${policy.name}`}
                onClick={() => setEditing(policy)}
              >
                Edit
              </Button>
              <Button
                disabled={status.isPending}
                color={policy.status === "active" ? "warning" : "success"}
                onClick={() =>
                  void status.mutateAsync({
                    uuid: policy.uuid,
                    status: policy.status === "active" ? "inactive" : "active",
                  })
                }
              >
                {policy.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing && siteId ? (
        <PolicyDialog
          siteId={siteId}
          policy={editing === "new" ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </Paper>
  );
}

type StepDraft = {
  delay: string;
  role: (typeof recipientRoles)[number];
  channels: Record<(typeof notificationChannels)[number], boolean>;
};
function PolicyDialog({
  siteId,
  policy,
  onClose,
}: {
  siteId: number;
  policy?: EscalationPolicy;
  onClose: () => void;
}) {
  const create = useCreateEscalationPolicy(siteId);
  const update = useUpdateEscalationPolicy(siteId);
  const mutation = policy ? update : create;
  const [name, setName] = useState(policy?.name ?? "");
  const [owner, setOwner] = useState<(typeof recipientRoles)[number]>(
    policy?.owner_role ?? "PRIMARY_CONTACT",
  );
  const [warning, setWarning] = useState(
    policy?.eligible_severities.includes("WARNING") ?? true,
  );
  const [critical, setCritical] = useState(
    policy?.eligible_severities.includes("CRITICAL") ?? true,
  );
  const [steps, setSteps] = useState<StepDraft[]>(
    () =>
      policy?.steps.map((step) => ({
        delay: String(step.delay_seconds),
        role: step.recipient_role,
        channels: Object.fromEntries(
          notificationChannels.map((channel) => [
            channel,
            step.channels.includes(channel),
          ]),
        ) as StepDraft["channels"],
      })) ?? [blankStep("0")],
  );
  const [validation, setValidation] = useState<string>();
  function patchStep(index: number, patch: Partial<StepDraft>) {
    setSteps((current) =>
      current.map((step, position) =>
        position === index ? { ...step, ...patch } : step,
      ),
    );
  }
  function toggleChannel(
    index: number,
    channel: (typeof notificationChannels)[number],
    checked: boolean,
  ) {
    setSteps((current) =>
      current.map((step, position) =>
        position === index
          ? { ...step, channels: { ...step.channels, [channel]: checked } }
          : step,
      ),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    const parsed = parseSteps(name, warning, critical, steps);
    if (typeof parsed === "string") {
      setValidation(parsed);
      return;
    }
    setValidation(undefined);
    const eligible_severities = notificationSeverities.filter((severity) =>
      severity === "WARNING" ? warning : critical,
    );
    try {
      if (policy)
        await update.mutateAsync({
          uuid: policy.uuid,
          input: {
            name: name.trim(),
            owner_role: owner,
            eligible_severities,
            steps: parsed,
          },
        });
      else
        await create.mutateAsync({
          uuid: crypto.randomUUID(),
          site_id: siteId,
          name: name.trim(),
          owner_role: owner,
          eligible_severities,
          steps: parsed,
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
          {policy ? `Edit ${policy.name}` : "Add escalation policy"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {validation ? <Alert severity="error">{validation}</Alert> : null}
            {mutation.isError ? (
              <Alert severity="error">Policy could not be saved.</Alert>
            ) : null}
            <TextField
              required
              label="Policy name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <FormControl>
              <InputLabel id="owner-role-label">Owner role</InputLabel>
              <Select
                labelId="owner-role-label"
                label="Owner role"
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              >
                {recipientRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {formatEnum(role)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Stack direction="row" spacing={2}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={warning}
                    onChange={(event) => setWarning(event.target.checked)}
                  />
                }
                label="Warning eligible"
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={critical}
                    onChange={(event) => setCritical(event.target.checked)}
                  />
                }
                label="Critical eligible"
              />
            </Stack>
            {steps.map((step, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">Step {index + 1}</Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      required
                      type="number"
                      label={`Step ${index + 1} delay (seconds)`}
                      value={step.delay}
                      onChange={(event) =>
                        patchStep(index, { delay: event.target.value })
                      }
                      slotProps={{
                        htmlInput: { min: 0, max: 604800, step: 1 },
                      }}
                    />
                    <FormControl sx={{ minWidth: 190 }}>
                      <InputLabel id={`step-${index}-role-label`}>
                        Recipient role
                      </InputLabel>
                      <Select
                        labelId={`step-${index}-role-label`}
                        label="Recipient role"
                        value={step.role}
                        onChange={(event) =>
                          patchStep(index, { role: event.target.value })
                        }
                      >
                        {recipientRoles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {formatEnum(role)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    {steps.length > 1 ? (
                      <Button
                        color="error"
                        onClick={() =>
                          setSteps((current) =>
                            current.filter((_, position) => position !== index),
                          )
                        }
                      >
                        Remove step
                      </Button>
                    ) : null}
                  </Stack>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
                    {notificationChannels.map((channel) => (
                      <FormControlLabel
                        key={channel}
                        control={
                          <Checkbox
                            checked={step.channels[channel]}
                            onChange={(event) =>
                              toggleChannel(
                                index,
                                channel,
                                event.target.checked,
                              )
                            }
                          />
                        }
                        label={channel}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              disabled={steps.length >= 20}
              onClick={() =>
                setSteps((current) => [
                  ...current,
                  blankStep(String((Number(current.at(-1)?.delay) || 0) + 60)),
                ])
              }
            >
              Add step
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
            {mutation.isPending ? "Saving…" : "Save policy"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function blankStep(delay: string): StepDraft {
  return {
    delay,
    role: "PRIMARY_CONTACT",
    channels: { EMAIL: true, SMS: false, WHATSAPP: false },
  };
}
function parseSteps(
  name: string,
  warning: boolean,
  critical: boolean,
  drafts: StepDraft[],
): EscalationStepInput[] | string {
  if (!name.trim()) return "Policy name is required.";
  if (!warning && !critical) return "Select at least one eligible severity.";
  const parsed: EscalationStepInput[] = [];
  for (const [index, draft] of drafts.entries()) {
    const delay_seconds = Number(draft.delay);
    if (
      !Number.isInteger(delay_seconds) ||
      delay_seconds < 0 ||
      delay_seconds > 604800
    )
      return "Step delays must be whole seconds from 0 to 604800.";
    if (index > 0 && delay_seconds <= parsed[index - 1].delay_seconds)
      return "Step delays must increase strictly.";
    const channels = notificationChannels.filter(
      (channel) => draft.channels[channel],
    );
    if (channels.length === 0)
      return `Step ${index + 1} requires at least one channel.`;
    parsed.push({
      position: index + 1,
      delay_seconds,
      recipient_role: draft.role,
      channels,
    });
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
