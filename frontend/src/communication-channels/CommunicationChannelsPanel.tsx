import {
  Alert,
  Button,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";
import type { ApiRequestOptions } from "../api/client";
import type { Site } from "../monitoredAreas/contracts";

type Channel = "EMAIL" | "TELEGRAM" | "WHATSAPP" | "SMS";
type Request = <T>(
  path: `/${string}`,
  options?: Omit<ApiRequestOptions, "auth">,
) => Promise<T>;
interface Props {
  request: Request;
  basePath: `/${string}`;
  title?: string;
  sites: Site[];
}
const channels: Channel[] = ["EMAIL", "TELEGRAM", "WHATSAPP", "SMS"];
const commonDefaults = { enabled: "true", priority: "1" };
const defaults: Record<Channel, Record<string, string>> = {
  EMAIL: {
    ...commonDefaults,
    host: "",
    port: "587",
    security: "STARTTLS",
    senderName: "BIO EMS",
    senderAddress: "",
    username: "",
    password: "",
  },
  TELEGRAM: { ...commonDefaults, botToken: "" },
  WHATSAPP: {
    ...commonDefaults,
    phoneNumberId: "",
    businessAccountId: "",
    senderIdentity: "",
    templateName: "",
    languageCode: "en_US",
    accessToken: "",
  },
  SMS: {
    ...commonDefaults,
    transport: "HTTP",
    simNumber: "",
    operator: "",
    apn: "",
    comPort: "",
    providerUrl: "",
    providerAccount: "",
    providerToken: "",
  },
};

export function CommunicationChannelsPanel({
  request,
  basePath,
  title = "Communication channels",
  sites,
}: Props) {
  const cache = useQueryClient();
  const { language } = useLocalization();
  const ar = language === "ar";
  const [channel, setChannel] = useState<Channel>("EMAIL");
  const [form, setForm] = useState(defaults.EMAIL);
  const [dirty, setDirty] = useState(false);
  const [testSiteId, setTestSiteId] = useState("");
  const [destination, setDestination] = useState("");
  const key = ["communication-channels", basePath];
  const query = useQuery({
    queryKey: key,
    queryFn: async () =>
      (await request<{
        channels: Array<{
          config: Record<string, unknown>;
          secretsConfigured: boolean;
        }>;
      }>(basePath)) ?? { channels: [] },
  });
  const current = query.data?.channels.find(
    (item) => item.config.channel === channel,
  );
  const displayed = dirty
    ? form
    : ({ ...defaults[channel], ...(current?.config ?? {}) } as Record<
        string,
        string
      >);
  const mutation = useMutation({
    mutationFn: () =>
      request(`${basePath}/${channel}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          siteId: null,
          config: buildConfig(channel, displayed),
          secrets: buildSecrets(channel, displayed),
        }),
      }),
    onSuccess: () => cache.invalidateQueries({ queryKey: key }),
  });
  const testMutation = useMutation({
    mutationFn: () =>
      request<{ messageId: string }>(`${basePath}/${channel}/test`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId: Number(testSiteId), destination }),
      }),
  });
  return (
    <Paper variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={2}>
        <Typography component="h2" variant="h5">
          {title}
        </Typography>
        <Typography color="text.secondary">
          {ar
            ? "هذه البيانات تخص حسابات الإرسال الخاصة بمنصة BIO-EMS وليست بيانات مستلمي الإنذارات. الأسرار لا تُعرض بعد حفظها؛ ترك حقل السر فارغًا يحتفظ بالقيمة الحالية."
            : "These are BIO-EMS platform sender-account settings, not alarm-recipient details. Secrets are never displayed after saving; leave a secret blank to keep its current value."}
        </Typography>
        <TextField
          select
          label="Channel"
          value={channel}
          onChange={(e) => {
            setChannel(e.target.value as Channel);
            setDirty(false);
          }}
        >
          {channels.map((value) => (
            <MenuItem key={value} value={value}>
              {value}
            </MenuItem>
          ))}
        </TextField>
        {Object.keys(defaults[channel]).map((name) => (
          <TextField
            key={`${channel}-${name}`}
            label={label(name)}
            type={
              secretFields.has(name)
                ? "password"
                : name === "port"
                  ? "number"
                  : "text"
            }
            value={String(displayed[name] ?? "")}
            onChange={(e) => {
              setForm({ ...displayed, [name]: e.target.value });
              setDirty(true);
            }}
            helperText={
              secretFields.has(name) && current?.secretsConfigured
                ? "Configured — blank keeps current value"
                : undefined
            }
          />
        ))}
        {mutation.isError ? (
          <Alert severity="error">Settings were not saved.</Alert>
        ) : null}
        {mutation.isSuccess ? (
          <Alert severity="success">Settings saved.</Alert>
        ) : null}
        <Stack direction="row" spacing={1}>
          <Button
            variant="contained"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            Save
          </Button>
          <Button onClick={() => setDirty(false)}>Cancel</Button>
        </Stack>
        <Typography component="h3" variant="h6">
          Send configuration test
        </Typography>
        <TextField
          select
          label={ar ? "الموقع لاختبار الإرسال" : "Site for delivery test"}
          value={testSiteId}
          onChange={(event) => setTestSiteId(event.target.value)}
          helperText={
            ar
              ? "اختر موقعًا مسجلًا فعليًا؛ لا تُدخل Site ID يدويًا."
              : "Choose a registered Site; do not enter a Site ID manually."
          }
        >
          <MenuItem value="" disabled>
            {ar ? "اختر موقعًا" : "Select a Site"}
          </MenuItem>
          {sites
            .filter((site) => site.id)
            .map((site) => (
              <MenuItem key={site.id} value={String(site.id)}>
                {site.name} ({site.code})
              </MenuItem>
            ))}
        </TextField>
        <TextField
          label={ar ? "مستلم رسالة الاختبار" : "Test recipient"}
          helperText={
            ar
              ? "للاختبار فقط: بريد إلكتروني أو Telegram Chat ID أو رقم E.164 حسب القناة. مستلمو الإنذارات الفعليون يُدارون في Notification recipients."
              : "Test only: email, Telegram Chat ID, or E.164 number as appropriate. Production alarm recipients are managed under Notification recipients."
          }
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
        />
        <Button
          variant="outlined"
          disabled={testMutation.isPending || !testSiteId || !destination}
          onClick={() => testMutation.mutate()}
        >
          Send test
        </Button>
        {testMutation.isSuccess ? (
          <Alert severity="success">
            Test sent. Receipt: {testMutation.data.messageId}
          </Alert>
        ) : null}
        {testMutation.isError ? (
          <Alert severity="error">Test failed. No success was recorded.</Alert>
        ) : null}
      </Stack>
    </Paper>
  );
}

const secretFields = new Set([
  "password",
  "botToken",
  "accessToken",
  "providerToken",
]);
const label = (name: string) =>
  name.replace(/([A-Z])/g, " $1").replace(/^./, (value) => value.toUpperCase());
function buildSecrets(channel: Channel, form: Record<string, string>) {
  const field = {
    EMAIL: "password",
    TELEGRAM: "botToken",
    WHATSAPP: "accessToken",
    SMS: "providerToken",
  }[channel];
  return { [field]: form[field] ?? "" };
}
function buildConfig(channel: Channel, form: Record<string, string>) {
  const common = {
    channel,
    enabled: form.enabled !== "false",
    priority: Number(form.priority),
  };
  if (channel === "EMAIL")
    return {
      ...common,
      host: form.host,
      port: Number(form.port),
      security: form.security,
      senderName: form.senderName,
      senderAddress: form.senderAddress,
      username: form.username,
    };
  if (channel === "TELEGRAM") return common;
  if (channel === "WHATSAPP")
    return {
      ...common,
      provider: "META",
      phoneNumberId: form.phoneNumberId,
      businessAccountId: form.businessAccountId,
      senderIdentity: form.senderIdentity,
      templateName: form.templateName,
      languageCode: form.languageCode,
    };
  return {
    ...common,
    transport: form.transport,
    simNumber: form.simNumber,
    operator: form.operator,
    apn: form.apn,
    comPort: form.comPort,
    providerUrl: form.providerUrl,
    providerAccount: form.providerAccount,
  };
}
