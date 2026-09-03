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
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";

export function EscalationPoliciesPanel() {
  const { language } = useLocalization();
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
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
              {t("Escalation policies", "سياسات التصعيد")}
            </Typography>
            <Typography color="text.secondary">
              {t(
                "Ordered, Site-scoped notification steps with strictly increasing elapsed delays.",
                "خطوات إشعار مرتبة خاصة بالموقع مع تأخيرات زمنية متزايدة إلزاميًا.",
              )}
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={!siteId}
            onClick={() => setEditing("new")}
          >
            {t("Add policy", "إضافة سياسة")}
          </Button>
        </Box>
        {sites.isPending ? (
          <CircularProgress
            aria-label={t("Loading policy Sites", "جارٍ تحميل مواقع السياسات")}
          />
        ) : null}
        {sites.isError ? (
          <Alert severity="error">
            {t(
              "Unable to load Sites for escalation policies.",
              "تعذر تحميل المواقع لسياسات التصعيد.",
            )}
          </Alert>
        ) : null}
        {(sites.data?.length ?? 0) > 0 ? (
          <FormControl fullWidth>
            <InputLabel id="policy-site-label">
              {t("Policy Site", "موقع السياسة")}
            </InputLabel>
            <Select
              labelId="policy-site-label"
              label={t("Policy Site", "موقع السياسة")}
              value={siteId ?? ""}
              onChange={(event) => setSelectedSite(Number(event.target.value))}
            >
              <MenuItem value="" disabled>
                {t("Select a Site", "اختر موقعًا")}
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
            {t(
              "Create a Site before configuring escalation policies.",
              "أنشئ موقعًا قبل إعداد سياسات التصعيد.",
            )}
          </Alert>
        ) : null}
        {!sites.isPending &&
        !sites.isError &&
        !siteId &&
        (sites.data?.length ?? 0) > 0 ? (
          <Alert severity="info">
            {t(
              "Select a Site before loading or changing escalation policies.",
              "اختر موقعًا قبل تحميل سياسات التصعيد أو تغييرها.",
            )}
          </Alert>
        ) : null}
        {policies.isPending && siteId ? (
          <CircularProgress
            aria-label={t(
              "Loading escalation policies",
              "جارٍ تحميل سياسات التصعيد",
            )}
          />
        ) : null}
        {policies.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void policies.refetch()}>
                {t("Retry", "إعادة المحاولة")}
              </Button>
            }
          >
            {t(
              "Unable to load escalation policies.",
              "تعذر تحميل سياسات التصعيد.",
            )}
          </Alert>
        ) : null}
        {!policies.isPending &&
        !policies.isError &&
        siteId &&
        policies.data?.length === 0 ? (
          <Alert severity="info">
            {t(
              "No escalation policies are configured for this Site.",
              "لا توجد سياسات تصعيد مُعدة لهذا الموقع.",
            )}
          </Alert>
        ) : null}
        {status.isError ? (
          <Alert severity="error">
            {t(
              "Policy status could not be changed.",
              "تعذر تغيير حالة السياسة.",
            )}
          </Alert>
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
                  label={
                    language === "ar"
                      ? policy.status === "active"
                        ? "نشطة"
                        : "غير نشطة"
                      : policy.status
                  }
                  color={policy.status === "active" ? "success" : "default"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${policy.steps.length} ${t("steps", "خطوات")}`}
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                {t("Owner", "المسؤول")}:{" "}
                {formatEnum(policy.owner_role, language)} ·{" "}
                {policy.eligible_severities
                  .map((value) => formatEnum(value, language))
                  .join("/")}{" "}
                · {t("Delays", "التأخيرات")}:{" "}
                {policy.steps
                  .map((step) => `${step.delay_seconds}s`)
                  .join(" → ")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                aria-label={`${t("Edit", "تعديل")} ${policy.name}`}
                onClick={() => setEditing(policy)}
              >
                {t("Edit", "تعديل")}
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
                {policy.status === "active"
                  ? t("Deactivate", "إلغاء التفعيل")
                  : t("Activate", "تفعيل")}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing && siteId ? (
        <PolicyDialog
          siteId={siteId}
          policy={editing === "new" ? undefined : editing}
          language={language}
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
  language,
  onClose,
}: {
  siteId: number;
  policy?: EscalationPolicy;
  language: "en" | "ar";
  onClose: () => void;
}) {
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
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
    const parsed = parseSteps(name, warning, critical, steps, language);
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
          {policy
            ? `${t("Edit", "تعديل")} ${policy.name}`
            : t("Add escalation policy", "إضافة سياسة تصعيد")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {validation ? <Alert severity="error">{validation}</Alert> : null}
            {mutation.isError ? (
              <Alert severity="error">
                {t("Policy could not be saved.", "تعذر حفظ السياسة.")}
              </Alert>
            ) : null}
            <TextField
              required
              label={t("Policy name", "اسم السياسة")}
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <FormControl>
              <InputLabel id="owner-role-label">
                {t("Owner role", "دور المسؤول")}
              </InputLabel>
              <Select
                labelId="owner-role-label"
                label={t("Owner role", "دور المسؤول")}
                value={owner}
                onChange={(event) => setOwner(event.target.value)}
              >
                {recipientRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {formatEnum(role, language)}
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
                label={t("Warning eligible", "مؤهل للتحذير")}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={critical}
                    onChange={(event) => setCritical(event.target.checked)}
                  />
                }
                label={t("Critical eligible", "مؤهل للحرج")}
              />
            </Stack>
            {steps.map((step, index) => (
              <Paper key={index} variant="outlined" sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Typography variant="subtitle1">
                    {t("Step", "الخطوة")} {index + 1}
                  </Typography>
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                    <TextField
                      required
                      type="number"
                      label={`${t("Step", "الخطوة")} ${index + 1} ${t("delay (seconds)", "التأخير (ثانية)")}`}
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
                        {t("Recipient role", "دور المستلم")}
                      </InputLabel>
                      <Select
                        labelId={`step-${index}-role-label`}
                        label={t("Recipient role", "دور المستلم")}
                        value={step.role}
                        onChange={(event) =>
                          patchStep(index, { role: event.target.value })
                        }
                      >
                        {recipientRoles.map((role) => (
                          <MenuItem key={role} value={role}>
                            {formatEnum(role, language)}
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
                        {t("Remove step", "إزالة الخطوة")}
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
              {t("Add step", "إضافة خطوة")}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {t("Cancel", "إلغاء")}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? t("Saving…", "جارٍ الحفظ…")
              : t("Save policy", "حفظ السياسة")}
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
  language: "en" | "ar" = "en",
): EscalationStepInput[] | string {
  const ar = language === "ar";
  if (!name.trim())
    return ar ? "اسم السياسة مطلوب." : "Policy name is required.";
  if (!warning && !critical)
    return ar
      ? "اختر درجة شدة مؤهلة واحدة على الأقل."
      : "Select at least one eligible severity.";
  const parsed: EscalationStepInput[] = [];
  for (const [index, draft] of drafts.entries()) {
    const delay_seconds = Number(draft.delay);
    if (
      !Number.isInteger(delay_seconds) ||
      delay_seconds < 0 ||
      delay_seconds > 604800
    )
      return ar
        ? "يجب أن تكون تأخيرات الخطوات ثواني صحيحة من 0 إلى 604800."
        : "Step delays must be whole seconds from 0 to 604800.";
    if (index > 0 && delay_seconds <= parsed[index - 1].delay_seconds)
      return ar
        ? "يجب أن تتزايد تأخيرات الخطوات بصورة إلزامية."
        : "Step delays must increase strictly.";
    const channels = notificationChannels.filter(
      (channel) => draft.channels[channel],
    );
    if (channels.length === 0)
      return ar
        ? `تتطلب الخطوة ${index + 1} قناة واحدة على الأقل.`
        : `Step ${index + 1} requires at least one channel.`;
    parsed.push({
      position: index + 1,
      delay_seconds,
      recipient_role: draft.role,
      channels,
    });
  }
  return parsed;
}
function formatEnum(value: string, language: "en" | "ar" = "en") {
  if (language === "ar")
    return (
      (
        {
          PRIMARY_CONTACT: "جهة الاتصال الرئيسية",
          SECONDARY_CONTACT: "جهة اتصال ثانوية",
          ESCALATION_CONTACT: "جهة اتصال للتصعيد",
          WARNING: "تحذير",
          CRITICAL: "حرج",
        } as Record<string, string>
      )[value] ?? value
    );
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join(" ");
}
