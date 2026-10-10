import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";
const jobSchema = z.object({
  jobId: z.string(),
  state: z.enum([
    "UPLOADING",
    "PREPARED",
    "QUEUED",
    "APPLYING",
    "SUCCEEDED",
    "FAILED",
  ]),
  version: z.string().optional(),
  sourceCommit: z.string().optional(),
  sha256: z.string().optional(),
  error: z.string().optional(),
});
const statusSchema = z.object({
  installedVersion: z.string(),
  sourceCommit: z.string(),
  internetEnabled: z.literal(false),
  latestJob: jobSchema.nullable(),
});
export function SystemUpdatePage() {
  const { protectedRequest } = useAuthentication();
  const { language } = useLocalization();
  const ar = language === "ar";
  const [file, setFile] = useState<File | null>(null);
  const client = useQueryClient();
  const status = useQuery({
    queryKey: ["platform-updates"],
    queryFn: async () =>
      statusSchema.parse(await protectedRequest("/platform-updates")),
    refetchInterval: 3000,
    retry: false,
  });
  const refresh = () =>
    client.invalidateQueries({ queryKey: ["platform-updates"] });
  const upload = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select an update file");
      return jobSchema.parse(
        await protectedRequest("/platform-updates/upload", {
          method: "POST",
          headers: { "Content-Type": "application/octet-stream" },
          body: file,
        }),
      );
    },
    onSuccess: refresh,
  });
  const apply = useMutation({
    mutationFn: async () =>
      protectedRequest(
        `/platform-updates/${status.data!.latestJob!.jobId}/apply`,
        { method: "POST" },
      ),
    onSuccess: refresh,
  });
  const cancel = useMutation({
    mutationFn: async () =>
      protectedRequest(`/platform-updates/${status.data!.latestJob!.jobId}`, {
        method: "DELETE",
      }),
    onSuccess: refresh,
  });
  const job = status.data?.latestJob;
  const running = job?.state === "QUEUED" || job?.state === "APPLYING";
  const pending =
    upload.isPending ||
    apply.isPending ||
    cancel.isPending ||
    running ||
    job?.state === "PREPARED" ||
    job?.state === "UPLOADING";
  const states = {
    UPLOADING: ar ? "جارٍ رفع الملف" : "Uploading",
    PREPARED: ar
      ? "الحزمة معتمدة وجاهزة للتثبيت"
      : "Verified and ready to install",
    QUEUED: ar ? "في انتظار عامل التحديث" : "Waiting for update worker",
    APPLYING: ar ? "جارٍ تثبيت التحديث" : "Installing",
    SUCCEEDED: ar
      ? "نجح التحديث وفحص الخدمات"
      : "Update and health check succeeded",
    FAILED: ar ? "لم يكتمل التحديث" : "Update did not complete",
  };
  return (
    <Stack spacing={3}>
      <Typography variant="h4">
        {ar ? "تحديث النظام" : "System update"}
      </Typography>
      <Typography>
        {ar ? "الإصدار الحالي" : "Installed version"}:{" "}
        {status.data?.installedVersion ?? "—"}
      </Typography>
      <Typography variant="body2">
        Commit: {status.data?.sourceCommit ?? "—"}
      </Typography>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              {ar ? "التحديث من ملف" : "Update from file"}
            </Typography>
            <Alert severity="info">
              {ar
                ? "اختر ملف BIO-EMS Client Setup الموقّع المرسل من الشركة. يتم التحقق من الحزمة قبل التثبيت، ويحافظ مسار Repair على بيانات العميل والهوية مع نسخة احتياطية وفحص للخدمات. ستتوقف المراقبة والتنبيهات على الكمبيوتر مؤقتًا أثناء التحديث؛ اختر وقت صيانة مناسبًا."
                : "Select the signed BIO-EMS Client Setup EXE supplied by the company. The Repair lifecycle preserves customer data and identity, with a safety snapshot and service health checks. PC monitoring and alerts pause during installation; choose a maintenance window."}
            </Alert>
            <Button component="label" variant="outlined" disabled={pending}>
              {ar ? "اختيار ملف التحديث" : "Choose update file"}
              <input
                type="file"
                accept=".exe"
                disabled={pending}
                hidden
                onChange={(e) => {
                  setFile(e.target.files?.[0] ?? null);
                  upload.reset();
                }}
              />
            </Button>
            <Typography>
              {file?.name ?? (ar ? "لم يتم اختيار ملف" : "No file selected")}
            </Typography>
            <Button
              variant="contained"
              disabled={!file || pending || !status.data}
              onClick={() => upload.mutate()}
            >
              {upload.isPending
                ? ar
                  ? "جارٍ الرفع والتحقق…"
                  : "Uploading and verifying…"
                : ar
                  ? "رفع وفحص الحزمة"
                  : "Upload and verify"}
            </Button>
            {job && (
              <>
                <Alert
                  severity={
                    job.state === "FAILED"
                      ? "error"
                      : job.state === "SUCCEEDED"
                        ? "success"
                        : "info"
                  }
                >
                  {states[job.state]}
                  {job.error ? ` — ${job.error}` : ""}
                </Alert>
                <Typography>
                  {ar ? "إصدار الحزمة" : "Package version"}:{" "}
                  {job.version ?? "—"}
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  Commit: {job.sourceCommit ?? "—"}
                  <br />
                  SHA256: {job.sha256 ?? "—"}
                </Typography>
              </>
            )}
            {job?.state === "PREPARED" && (
              <>
                <Button
                  variant="contained"
                  disabled={apply.isPending || cancel.isPending}
                  onClick={() => apply.mutate()}
                >
                  {ar
                    ? "بدء التحديث — توقف مؤقت للخدمات"
                    : "Install update — temporary service interruption"}
                </Button>
                <Button
                  disabled={apply.isPending || cancel.isPending}
                  onClick={() => cancel.mutate()}
                >
                  {ar ? "إلغاء الحزمة" : "Discard package"}
                </Button>
              </>
            )}
            {running && (
              <Alert severity="warning">
                {ar
                  ? "قد ينقطع اتصال الصفحة أثناء التثبيت. اترك الكمبيوتر يعمل؛ الصفحة ستعيد طلب النتيجة عند رجوع الخدمة."
                  : "This page may disconnect during installation. Keep the PC powered on; it will poll for the result when the service returns."}
              </Alert>
            )}
            {status.isError && !running && (
              <Alert severity="error">
                {ar
                  ? "تعذر قراءة حالة التحديث. تحقق من اتصال النظام."
                  : "Could not read update status. Check the system connection."}
              </Alert>
            )}
            {[upload.error, apply.error, cancel.error]
              .filter(Boolean)
              .map((error, i) => (
                <Alert severity="error" key={i}>
                  {error instanceof Error ? error.message : String(error)}
                </Alert>
              ))}
          </Stack>
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Typography variant="h6">
              {ar ? "التحديث عبر الإنترنت" : "Update over the internet"}
            </Typography>
            <Alert severity="info">
              {ar
                ? "غير متاح في البيلوت. يُفعّل بعد تجهيز خادم تحديثات الشركة؛ ويستخدم نفس مسار التحقق والتثبيت."
                : "Disabled in Pilot. Available after the company update server is configured, using the same verification and installation path."}
            </Alert>
            <Button disabled>
              {ar ? "البحث عن تحديث وتنزيله" : "Check and download update"}
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}
