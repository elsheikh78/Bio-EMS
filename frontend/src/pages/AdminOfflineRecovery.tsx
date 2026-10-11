import { Alert, Button, Stack, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { z } from "zod";
import { apiRequest } from "../api/client";

const requestSchema = z
  .object({
    schemaVersion: z.literal(1),
    purpose: z.literal("CUSTOMER_ADMIN_RECOVERY_REQUEST"),
    requestId: z.string().uuid(),
    installationId: z.string().uuid(),
    username: z.string(),
    customerName: z.string(),
    customerCode: z.string(),
    siteName: z.string(),
    siteCode: z.string(),
    challenge: z.string(),
    requestedAt: z.string().datetime(),
    expiresAt: z.string().datetime(),
  })
  .strict();
const grantSchema = z
  .object({
    recoveryToken: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
    expiresAt: z.string().datetime(),
    username: z.string(),
  })
  .strict();

export function AdminOfflineRecovery({ language }: { language: "en" | "ar" }) {
  const ar = language === "ar";
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [grant, setGrant] = useState<z.infer<typeof grantSchema> | null>(null);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const action = async (run: () => Promise<void>) => {
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      await run();
    } catch {
      setError(
        ar
          ? "تعذر إكمال العملية. تحقق من الملف وصلاحيته والمفتاح المعتمد وسياسة كلمة المرور؛ أو تواصل مع الشركة."
          : "Could not complete recovery. Check the file, expiry, approved signing key and password policy, or contact the company.",
      );
    } finally {
      setPending(false);
    }
  };
  const create = () =>
    action(async () => {
      const request = requestSchema.parse(
        await apiRequest("/auth/admin-recovery/request", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username }),
        }),
      );
      const url = URL.createObjectURL(
        new Blob([JSON.stringify(request, null, 2)], {
          type: "application/json",
        }),
      );
      const link = document.createElement("a");
      try {
        link.href = url;
        link.download = `BIO-EMS-Admin-Recovery-Request-${request.requestId}.json`;
        document.body.appendChild(link);
        link.click();
      } finally {
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }
      setNotice(
        ar
          ? "تم تجهيز ملف الطلب. أرسله للشركة للتحقق وإصدار تصريح. هذا لا يؤكد وجود الحساب."
          : "Request file prepared. Send it to the company for identity verification and a signed permit. This does not confirm the account exists.",
      );
    });
  const importPermit = () =>
    action(async () => {
      if (!file || file.size > 16384) throw new Error("Invalid permit file");
      const candidate: unknown = JSON.parse(await file.text());
      const next = grantSchema.parse(
        await apiRequest("/auth/admin-recovery/authorize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(candidate),
        }),
      );
      setGrant(next);
      setPassword("");
      setConfirm("");
      setFile(null);
    });
  const complete = () =>
    action(async () => {
      if (!grant || password !== confirm) throw new Error("Password mismatch");
      z.object({ success: z.literal(true) }).parse(
        await apiRequest("/auth/admin-recovery/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recoveryToken: grant.recoveryToken,
            newPassword: password,
          }),
        }),
      );
      setGrant(null);
      setPassword("");
      setConfirm("");
      setDone(true);
    });

  return (
    <Stack spacing={2} sx={{ mt: 2 }}>
      <Typography variant="h6">
        {ar ? "استعادة Admin بملف من الشركة" : "Offline ADMIN recovery"}
      </Typography>
      {error && <Alert severity="error">{error}</Alert>}
      {notice && <Alert severity="info">{notice}</Alert>}
      {done ? (
        <Alert severity="success">
          {ar
            ? "تم تعيين كلمة المرور. ارجع لتسجيل الدخول؛ التصريح تم استخدامه."
            : "Password set. Return to sign in; the permit has been consumed."}
        </Alert>
      ) : grant ? (
        <>
          <Alert severity="info">
            {ar
              ? "تصريح صالح لتعيين كلمة المرور فقط"
              : "Authorized for password reset only"}
            : {grant.username}
            <br />
            {ar ? "ينتهي" : "Expires"}: {grant.expiresAt}
          </Alert>
          <TextField
            label={ar ? "كلمة المرور الجديدة" : "New password"}
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={pending}
          />
          <TextField
            label={ar ? "تأكيد كلمة المرور" : "Confirm new password"}
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            disabled={pending}
          />
          <Typography variant="body2">
            {ar
              ? "12 حرفًا على الأقل، مع حرف إنجليزي كبير وصغير ورقم."
              : "At least 12 characters, with uppercase, lowercase and a number."}
          </Typography>
          <Button
            type="button"
            variant="contained"
            disabled={pending || password.length < 12 || password !== confirm}
            onClick={() => void complete()}
          >
            {ar ? "حفظ كلمة المرور الجديدة" : "Save new password"}
          </Button>
        </>
      ) : (
        <>
          <TextField
            label={ar ? "اسم مستخدم Admin" : "ADMIN username"}
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={pending}
          />
          <Button
            type="button"
            disabled={pending || !username.trim()}
            onClick={() => void create()}
          >
            {ar ? "تصدير طلب الاستعادة" : "Export recovery request"}
          </Button>
          <Button type="button" component="label" disabled={pending}>
            {ar ? "اختيار تصريح الشركة" : "Choose company permit"}
            <input
              type="file"
              accept=".json"
              hidden
              disabled={pending}
              onChange={(e) => {
                setFile(e.target.files?.[0] ?? null);
                setError(null);
              }}
            />
          </Button>
          <Typography variant="body2">{file?.name}</Typography>
          <Button
            type="button"
            disabled={pending || !file}
            onClick={() => void importPermit()}
          >
            {ar ? "التحقق من التصريح" : "Verify permit"}
          </Button>
        </>
      )}
    </Stack>
  );
}
