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
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";

export function NotificationRecipientsPanel() {
  const { language } = useLocalization();
  const ar = language === "ar";
  const sitesQuery = useSites();
  const [siteId, setSiteId] = useState<number>();
  const [editing, setEditing] = useState<NotificationRecipient | "new">();
  const effectiveSiteId = siteId;
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
              {ar ? "مستلمو الإشعارات" : "Notification recipients"}
            </Typography>
            <Typography color="text.secondary">
              {ar
                ? "جهات اتصال خاصة بالموقع وأهلية درجات الشدة. لا تُوضع بيانات الاتصال في عناوين URL مطلقًا."
                : "Site-scoped contacts and severity eligibility. Contact values are never placed in URLs."}
            </Typography>
          </Box>
          <Button
            variant="contained"
            disabled={!effectiveSiteId}
            onClick={() => setEditing("new")}
          >
            {ar ? "إضافة مستلم" : "Add recipient"}
          </Button>
        </Box>

        {sitesQuery.isPending ? (
          <CircularProgress
            aria-label={ar ? "جارٍ تحميل المواقع" : "Loading sites"}
          />
        ) : null}
        {sitesQuery.isError ? (
          <Alert severity="error">
            {ar ? "تعذر تحميل المواقع." : "Unable to load Sites."}
          </Alert>
        ) : null}
        {(sitesQuery.data?.length ?? 0) > 0 ? (
          <FormControl fullWidth>
            <InputLabel id="recipient-site-label">
              {ar ? "الموقع" : "Site"}
            </InputLabel>
            <Select
              labelId="recipient-site-label"
              label={ar ? "الموقع" : "Site"}
              value={effectiveSiteId ?? ""}
              onChange={(event) => setSiteId(Number(event.target.value))}
            >
              <MenuItem value="" disabled>
                {ar ? "اختر موقعًا" : "Select a Site"}
              </MenuItem>
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
            {ar
              ? "أنشئ موقعًا قبل إعداد المستلمين."
              : "Create a Site before configuring recipients."}
          </Alert>
        ) : null}
        {!sitesQuery.isPending &&
        !sitesQuery.isError &&
        !effectiveSiteId &&
        (sitesQuery.data?.length ?? 0) > 0 ? (
          <Alert severity="info">
            {ar
              ? "اختر موقعًا قبل تحميل مستلمي الإشعارات أو تغييرهم."
              : "Select a Site before loading or changing notification recipients."}
          </Alert>
        ) : null}

        {recipientsQuery.isPending && effectiveSiteId ? (
          <CircularProgress
            aria-label={ar ? "جارٍ تحميل المستلمين" : "Loading recipients"}
          />
        ) : null}
        {recipientsQuery.isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                onClick={() => void recipientsQuery.refetch()}
              >
                {ar ? "إعادة المحاولة" : "Retry"}
              </Button>
            }
          >
            {ar ? "تعذر تحميل المستلمين." : "Unable to load recipients."}
          </Alert>
        ) : null}
        {!recipientsQuery.isPending &&
        !recipientsQuery.isError &&
        effectiveSiteId &&
        recipientsQuery.data?.length === 0 ? (
          <Alert severity="info">
            {ar
              ? "لا يوجد مستلمو إشعارات مُعدون لهذا الموقع."
              : "No notification recipients are configured for this Site."}
          </Alert>
        ) : null}
        {statusMutation.isError ? (
          <Alert severity="error">
            {ar
              ? "تعذر تغيير حالة المستلم."
              : "Recipient status could not be changed."}
          </Alert>
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
                  label={
                    ar
                      ? recipient.status === "active"
                        ? "نشط"
                        : "غير نشط"
                      : recipient.status
                  }
                  color={recipient.status === "active" ? "success" : "default"}
                />
                <Chip
                  size="small"
                  variant="outlined"
                  label={formatEnum(recipient.role, language)}
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
                aria-label={`${ar ? "تعديل" : "Edit"} ${recipient.display_name}`}
              >
                {ar ? "تعديل" : "Edit"}
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
                {recipient.status === "active"
                  ? ar
                    ? "إلغاء التفعيل"
                    : "Deactivate"
                  : ar
                    ? "تفعيل"
                    : "Activate"}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing && effectiveSiteId ? (
        <RecipientDialog
          siteId={effectiveSiteId}
          recipient={editing === "new" ? undefined : editing}
          language={language}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
    </Paper>
  );
}

interface RecipientDialogProps {
  siteId: number;
  recipient?: NotificationRecipient;
  language: "en" | "ar";
  onClose: () => void;
}
type EndpointDraft = {
  channel: NotificationEndpointInput["channel"];
  address: string;
  warning: boolean;
  critical: boolean;
};

function RecipientDialog({
  siteId,
  recipient,
  language,
  onClose,
}: RecipientDialogProps) {
  const ar = language === "ar";
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
    const parsed = parseRecipient(name, endpoints, language);
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
            ? `${ar ? "تعديل" : "Edit"} ${recipient.display_name}`
            : ar
              ? "إضافة مستلم إشعارات"
              : "Add notification recipient"}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 1 }}>
            {validation ? <Alert severity="error">{validation}</Alert> : null}
            {mutation.isError ? (
              <Alert severity="error">
                {ar
                  ? "تعذر حفظ المستلم. لم يتم تسجيل بيانات الاتصال."
                  : "Recipient could not be saved. Contact values were not logged."}
              </Alert>
            ) : null}
            <TextField
              required
              label={ar ? "اسم العرض" : "Display name"}
              value={name}
              onChange={(event) => setName(event.target.value)}
              slotProps={{ htmlInput: { maxLength: 200 } }}
            />
            <FormControl>
              <InputLabel id="recipient-role-label">
                {ar ? "الدور" : "Role"}
              </InputLabel>
              <Select
                labelId="recipient-role-label"
                label={ar ? "الدور" : "Role"}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {recipientRoles.map((value) => (
                  <MenuItem key={value} value={value}>
                    {formatEnum(value, language)}
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
                        {ar ? "القناة" : "Channel"}
                      </InputLabel>
                      <Select
                        labelId={`channel-${index}-label`}
                        label={ar ? "القناة" : "Channel"}
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
                      label={`${endpoint.channel} ${ar ? "العنوان" : "address"}`}
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
                        {ar ? "إزالة" : "Remove"}
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
                        label={formatEnum(severity, language)}
                      />
                    ))}
                  </Stack>
                </Stack>
              </Paper>
            ))}
            <Button
              variant="outlined"
              disabled={endpoints.length >= 4}
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
              {ar ? "إضافة قناة" : "Add channel"}
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={mutation.isPending}>
            {ar ? "إلغاء" : "Cancel"}
          </Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending
              ? ar
                ? "جارٍ الحفظ…"
                : "Saving…"
              : ar
                ? "حفظ المستلم"
                : "Save recipient"}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function parseRecipient(
  name: string,
  endpoints: EndpointDraft[],
  language: "en" | "ar" = "en",
): NotificationEndpointInput[] | string {
  const ar = language === "ar";
  if (!name.trim())
    return ar ? "اسم العرض مطلوب." : "Display name is required.";
  if (
    new Set(endpoints.map(({ channel }) => channel)).size !== endpoints.length
  )
    return ar
      ? "يمكن إعداد كل قناة مرة واحدة فقط."
      : "Each channel may be configured only once.";
  const parsed: NotificationEndpointInput[] = [];
  for (const endpoint of endpoints) {
    const address = endpoint.address.trim();
    const valid =
      endpoint.channel === "EMAIL"
        ? /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
        : endpoint.channel === "TELEGRAM"
          ? /^-?\d{1,20}$/.test(address)
          : /^\+[1-9]\d{7,14}$/.test(address);
    if (!valid)
      return endpoint.channel === "EMAIL"
        ? ar
          ? "عنوان البريد الإلكتروني غير صحيح."
          : "Email address is invalid."
        : endpoint.channel === "TELEGRAM"
          ? ar
            ? "يجب أن يكون عنوان Telegram هو Chat ID رقميًا."
            : "Telegram address must be a numeric Chat ID."
          : ar
            ? `يجب أن يستخدم عنوان ${endpoint.channel} صيغة E.164.`
            : `${endpoint.channel} address must use E.164 format.`;
    const eligible_severities = notificationSeverities.filter((severity) =>
      severity === "WARNING" ? endpoint.warning : endpoint.critical,
    );
    if (eligible_severities.length === 0)
      return ar
        ? "تتطلب كل قناة درجة شدة مؤهلة واحدة على الأقل."
        : "Each channel requires at least one eligible severity.";
    parsed.push({ channel: endpoint.channel, address, eligible_severities });
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
