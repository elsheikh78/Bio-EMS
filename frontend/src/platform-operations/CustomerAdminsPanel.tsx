import {
  Alert,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useLocalization } from "../localization/useLocalization";
import {
  useCreateCustomerAdmin,
  useCustomerAdmins,
  useCustomerAdminStatus,
  useResetCustomerAdminPassword,
} from "./customerAdmins";

const copy = {
  en: {
    title: "Customer ADMIN accounts",
    description:
      "Only SYSTEM_OWNER can create, enable, disable, or reset customer ADMIN accounts.",
    username: "Username",
    email: "Email",
    initialPassword: "Initial password",
    add: "Add ADMIN",
    createError: "ADMIN could not be created.",
    empty: "No ADMIN accounts have been created for this customer.",
    noEmail: "No email",
    disable: "Disable",
    enable: "Enable",
    reset: "Reset password",
    resetTitle: "Reset ADMIN password",
    newPassword: "New password",
    cancel: "Cancel",
    savePassword: "Save new password",
    resetError: "Password could not be reset.",
    resetSuccess: "The ADMIN password was reset successfully.",
  },
  ar: {
    title: "حسابات Admin الخاصة بالعميل",
    description:
      "مالك النظام فقط يمكنه إنشاء حسابات Admin أو تفعيلها أو تعطيلها أو إعادة تعيين كلمات مرورها.",
    username: "اسم المستخدم",
    email: "البريد الإلكتروني",
    initialPassword: "كلمة المرور الأولية",
    add: "إضافة Admin",
    createError: "تعذر إنشاء حساب Admin.",
    empty: "لم يتم إنشاء حسابات Admin لهذا العميل.",
    noEmail: "بدون بريد إلكتروني",
    disable: "تعطيل",
    enable: "تفعيل",
    reset: "إعادة تعيين كلمة المرور",
    resetTitle: "إعادة تعيين كلمة مرور Admin",
    newPassword: "كلمة المرور الجديدة",
    cancel: "إلغاء",
    savePassword: "حفظ كلمة المرور الجديدة",
    resetError: "تعذر إعادة تعيين كلمة المرور.",
    resetSuccess: "تمت إعادة تعيين كلمة مرور Admin بنجاح.",
  },
} as const;

export function CustomerAdminsPanel({ customerId }: { customerId: number }) {
  const { language } = useLocalization();
  const text = copy[language];
  const admins = useCustomerAdmins(customerId);
  const create = useCreateCustomerAdmin(customerId);
  const status = useCustomerAdminStatus(customerId);
  const reset = useResetCustomerAdminPassword(customerId);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetUserId, setResetUserId] = useState<number>();
  const [newPassword, setNewPassword] = useState("");
  const [resetSucceeded, setResetSucceeded] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    await create.mutateAsync({ username, email: email || null, password });
    setUsername("");
    setEmail("");
    setPassword("");
  };

  const submitReset = async (event: FormEvent) => {
    event.preventDefault();
    if (!resetUserId) return;
    await reset.mutateAsync({ userId: resetUserId, password: newPassword });
    setNewPassword("");
    setResetUserId(undefined);
    setResetSucceeded(true);
  };

  return (
    <Card variant="outlined">
      <CardContent>
        <Typography component="h2" variant="h6">
          {text.title}
        </Typography>
        <Typography color="text.secondary">{text.description}</Typography>
        <Stack
          component="form"
          onSubmit={(event) => void submit(event)}
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ my: 2 }}
        >
          <TextField
            required
            label={text.username}
            value={username}
            onChange={(event) => setUsername(event.target.value)}
          />
          <TextField
            label={text.email}
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          <TextField
            required
            label={text.initialPassword}
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            slotProps={{ htmlInput: { minLength: 12 } }}
          />
          <Button type="submit" variant="contained" disabled={create.isPending}>
            {text.add}
          </Button>
        </Stack>
        {create.isError ? (
          <Alert severity="error">{text.createError}</Alert>
        ) : null}
        {resetSucceeded ? (
          <Alert severity="success">{text.resetSuccess}</Alert>
        ) : null}
        {admins.data?.length === 0 ? (
          <Typography color="text.secondary">{text.empty}</Typography>
        ) : null}
        {admins.data?.map((admin) => (
          <Stack
            key={admin.id}
            direction={{ xs: "column", sm: "row" }}
            spacing={2}
            sx={{ alignItems: { sm: "center" }, my: 1 }}
          >
            <Typography sx={{ flexGrow: 1 }}>
              {admin.username} — {admin.email ?? text.noEmail} — {admin.status}
            </Typography>
            <Button
              disabled={status.isPending}
              onClick={() =>
                void status.mutateAsync({
                  userId: admin.id,
                  status: admin.status === "active" ? "disabled" : "active",
                })
              }
            >
              {admin.status === "active" ? text.disable : text.enable}
            </Button>
            <Button
              onClick={() => {
                setResetSucceeded(false);
                setResetUserId(admin.id);
              }}
            >
              {text.reset}
            </Button>
          </Stack>
        ))}
      </CardContent>
      <Dialog
        open={Boolean(resetUserId)}
        onClose={() => setResetUserId(undefined)}
      >
        <Stack component="form" onSubmit={(event) => void submitReset(event)}>
          <DialogTitle>{text.resetTitle}</DialogTitle>
          <DialogContent>
            <TextField
              required
              autoFocus
              fullWidth
              label={text.newPassword}
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              slotProps={{ htmlInput: { minLength: 12 } }}
              sx={{ mt: 1 }}
            />
            {reset.isError ? (
              <Alert severity="error">{text.resetError}</Alert>
            ) : null}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setResetUserId(undefined)}>
              {text.cancel}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={reset.isPending}
            >
              {text.savePassword}
            </Button>
          </DialogActions>
        </Stack>
      </Dialog>
    </Card>
  );
}
