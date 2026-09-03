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
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { type FormEvent, useState } from "react";
import {
  userRoles,
  type ManagedUser,
  type UpdateUserInput,
} from "../administration/contracts";
import {
  PASSWORD_REQUIREMENTS_TEXT,
  evaluatePasswordPolicy,
} from "../administration/passwordPolicy";
import {
  useAuditEvents,
  useCreateUser,
  useManagedUsers,
  useUpdateUser,
  useUpdateUserPassword,
  useUpdateUserStatus,
} from "../administration/queries";
import { ApiResponseError } from "../api/client";
import { useSites } from "../monitoredAreas/queries";
import { useOptionalLocalization as useLocalization } from "../localization/useOptionalLocalization";

export function AdministrationPage() {
  const { language } = useLocalization();
  const ar = language === "ar";
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {ar ? "الإدارة والمساءلة" : "Administration & accountability"}
        </Typography>
        <Typography component="h1" variant="h4">
          {ar ? "المستخدمون وسجل التدقيق" : "Users & Audit Log"}
        </Typography>
        <Typography color="text.secondary">
          {ar
            ? "إدارة دورة حياة هويات المستخدمين وأدلة النشاط غير القابلة للتعديل والخاصة بالموقع، للمدير فقط."
            : "ADMIN-only identity lifecycle and immutable Site-scoped activity evidence."}
        </Typography>
      </Box>
      <UsersPanel />
      <AuditPanel />
    </Stack>
  );
}

function UsersPanel() {
  const { language } = useLocalization();
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const users = useManagedUsers();
  const status = useUpdateUserStatus();
  const [editing, setEditing] = useState<ManagedUser | "new">();
  const [passwordUser, setPasswordUser] = useState<ManagedUser>();
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography component="h2" variant="h5">
            {t("User management", "إدارة المستخدمين")}
          </Typography>
          <Button variant="contained" onClick={() => setEditing("new")}>
            {t("Add user", "إضافة مستخدم")}
          </Button>
        </Box>
        {users.isPending ? (
          <CircularProgress
            aria-label={t("Loading users", "جارٍ تحميل المستخدمين")}
          />
        ) : null}
        {users.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void users.refetch()}>
                {t("Retry", "إعادة المحاولة")}
              </Button>
            }
          >
            {t("Unable to load users.", "تعذر تحميل المستخدمين.")}
          </Alert>
        ) : null}
        {!users.isPending && !users.isError && users.data?.length === 0 ? (
          <Alert severity="info">
            {t("No users are available.", "لا يوجد مستخدمون متاحون.")}
          </Alert>
        ) : null}
        {status.isError ? (
          <Alert severity="error">
            {t(
              "User status could not be changed.",
              "تعذر تغيير حالة المستخدم.",
            )}
          </Alert>
        ) : null}
        {users.data?.map((user) => (
          <Box
            key={user.id}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              gap: 2,
              flexDirection: { xs: "column", sm: "row" },
            }}
          >
            <Box>
              <Stack direction="row" spacing={1}>
                <Typography component="h3" variant="h6">
                  {user.username}
                </Typography>
                <Chip size="small" label={user.role} />
                <Chip
                  size="small"
                  label={
                    language === "ar"
                      ? user.status === "active"
                        ? "نشط"
                        : "معطّل"
                      : user.status
                  }
                  color={user.status === "active" ? "success" : "default"}
                />
              </Stack>
              <Typography color="text.secondary">
                {user.email ?? t("No email", "لا يوجد بريد إلكتروني")}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                aria-label={`${t("Edit", "تعديل")} ${user.username}`}
                onClick={() => setEditing(user)}
              >
                {t("Edit", "تعديل")}
              </Button>
              <Button
                aria-label={`${t("Password", "كلمة المرور")} ${user.username}`}
                onClick={() => setPasswordUser(user)}
              >
                {t("Password", "كلمة المرور")}
              </Button>
              <Button
                disabled={status.isPending}
                color={user.status === "active" ? "warning" : "success"}
                aria-label={`${user.status === "active" ? t("Disable", "تعطيل") : t("Activate", "تفعيل")} ${user.username}`}
                onClick={() =>
                  void status.mutateAsync({
                    id: user.id,
                    status: user.status === "active" ? "disabled" : "active",
                  })
                }
              >
                {user.status === "active"
                  ? t("Disable", "تعطيل")
                  : t("Activate", "تفعيل")}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing ? (
        <UserDialog
          user={editing === "new" ? undefined : editing}
          language={language}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      {passwordUser ? (
        <PasswordDialog
          user={passwordUser}
          language={language}
          onClose={() => setPasswordUser(undefined)}
        />
      ) : null}
    </Paper>
  );
}

function mutationErrorMessage(
  error: unknown,
  fallback: string,
  language: "en" | "ar" = "en",
): string {
  if (!(error instanceof ApiResponseError)) return fallback;
  const ar = language === "ar";

  switch (error.code) {
    case "SELF_ROLE_CHANGE_FORBIDDEN":
      return ar
        ? "لا يمكنك تغيير دورك الإداري بنفسك."
        : "You cannot change your own administrator role.";
    case "RESOURCE_ALREADY_EXISTS":
      return ar
        ? "اسم المستخدم أو البريد الإلكتروني موجود بالفعل."
        : "That user or email already exists.";
    case "VALIDATION_ERROR":
      return ar
        ? "القيم المدخلة لا تطابق الصيغة المطلوبة."
        : "The submitted values do not meet the required format.";
    case "USER_NOT_FOUND":
      return ar
        ? "لم يعد المستخدم موجودًا. حدّث الصفحة وحاول مرة أخرى."
        : "The user no longer exists. Refresh the page and try again.";
    default:
      return fallback;
  }
}

function UserDialog({
  user,
  language,
  onClose,
}: {
  user?: ManagedUser;
  language: "en" | "ar";
  onClose: () => void;
}) {
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const create = useCreateUser();
  const update = useUpdateUser();
  const mutation = user ? update : create;
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<(typeof userRoles)[number]>(
    user?.role ?? "VIEWER",
  );
  const [password, setPassword] = useState("");
  const passwordPolicy = evaluatePasswordPolicy(password);

  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (user) {
        const normalizedEmail = email.trim() || null;
        const input: UpdateUserInput = {};
        if (normalizedEmail !== user.email) input.email = normalizedEmail;
        if (role !== user.role) input.role = role;

        if (Object.keys(input).length === 0) {
          onClose();
          return;
        }

        await update.mutateAsync({ id: user.id, input });
      } else {
        if (!passwordPolicy.isValid) return;
        await create.mutateAsync({
          username: username.trim().toLowerCase(),
          email: email.trim() || null,
          role,
          password,
        });
      }
      onClose();
    } catch {
      /* mutation state renders error */
    }
  }
  return (
    <Dialog open fullWidth onClose={mutation.isPending ? undefined : onClose}>
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>
          {user
            ? `${t("Edit", "تعديل")} ${user.username}`
            : t("Add user", "إضافة مستخدم")}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {mutation.isError ? (
              <Alert severity="error">
                {mutationErrorMessage(
                  mutation.error,
                  t("User could not be saved.", "تعذر حفظ المستخدم."),
                  language,
                )}
              </Alert>
            ) : null}
            <TextField
              required
              disabled={Boolean(user)}
              label={t("Username", "اسم المستخدم")}
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <TextField
              type="email"
              label={t("Email", "البريد الإلكتروني")}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {!user ? (
              <TextField
                required
                type="password"
                label={t("Initial password", "كلمة المرور الأولية")}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                helperText={
                  language === "ar"
                    ? "12 حرفًا على الأقل وتحتوي على أحرف كبيرة وصغيرة ورقم ورمز."
                    : PASSWORD_REQUIREMENTS_TEXT
                }
                error={password.length > 0 && !passwordPolicy.isValid}
              />
            ) : null}
            <FormControl>
              <InputLabel id="managed-role-label">
                {t("Role", "الدور")}
              </InputLabel>
              <Select
                labelId="managed-role-label"
                label={t("Role", "الدور")}
                value={role}
                onChange={(event) => setRole(event.target.value)}
              >
                {userRoles.map((value) => (
                  <MenuItem key={value} value={value}>
                    {value}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || (!user && !passwordPolicy.isValid)}
          >
            {t("Save user", "حفظ المستخدم")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function PasswordDialog({
  user,
  language,
  onClose,
}: {
  user: ManagedUser;
  language: "en" | "ar";
  onClose: () => void;
}) {
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const mutation = useUpdateUserPassword();
  const [password, setPassword] = useState("");
  const passwordPolicy = evaluatePasswordPolicy(password);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!passwordPolicy.isValid) return;
    try {
      await mutation.mutateAsync({ id: user.id, password });
      onClose();
    } catch {
      /* mutation state renders error */
    }
  }
  return (
    <Dialog open fullWidth onClose={mutation.isPending ? undefined : onClose}>
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>
          {t("Change password for", "تغيير كلمة المرور للمستخدم")}{" "}
          {user.username}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {mutation.isError ? (
              <Alert severity="error">
                {mutationErrorMessage(
                  mutation.error,
                  t(
                    "Password could not be changed.",
                    "تعذر تغيير كلمة المرور.",
                  ),
                  language,
                )}
              </Alert>
            ) : null}
            <Alert severity="info">
              {t(
                "Passwords are never displayed, logged, or returned.",
                "لا تُعرض كلمات المرور أو تُسجل أو تُعاد مطلقًا.",
              )}
            </Alert>
            <TextField
              required
              type="password"
              label={t("New password", "كلمة المرور الجديدة")}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
              helperText={
                language === "ar"
                  ? "12 حرفًا على الأقل وتحتوي على أحرف كبيرة وصغيرة ورقم ورمز."
                  : PASSWORD_REQUIREMENTS_TEXT
              }
              error={password.length > 0 && !passwordPolicy.isValid}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>{t("Cancel", "إلغاء")}</Button>
          <Button
            type="submit"
            variant="contained"
            disabled={mutation.isPending || !passwordPolicy.isValid}
          >
            {t("Change password", "تغيير كلمة المرور")}
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function AuditPanel() {
  const { language } = useLocalization();
  const t = (en: string, ar: string) => (language === "ar" ? ar : en);
  const sites = useSites();
  const [selected, setSelected] = useState<number>();
  const siteId = selected;
  const events = useAuditEvents(siteId);
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h5">
            {t("Audit Log", "سجل التدقيق")}
          </Typography>
          <Typography color="text.secondary">
            {t(
              "Newest immutable Site events. Structured prior/new values are deliberately omitted from this summary.",
              "أحدث أحداث الموقع غير القابلة للتعديل. حُذفت القيم السابقة والجديدة المنظمة عمدًا من هذا الملخص.",
            )}
          </Typography>
        </Box>
        {sites.isPending ? (
          <CircularProgress
            aria-label={t("Loading audit Sites", "جارٍ تحميل مواقع التدقيق")}
          />
        ) : null}
        {sites.isError ? (
          <Alert severity="error">
            {t(
              "Unable to load Sites for Audit Log.",
              "تعذر تحميل المواقع لسجل التدقيق.",
            )}
          </Alert>
        ) : null}
        {(sites.data?.length ?? 0) > 0 ? (
          <FormControl>
            <InputLabel id="audit-site-label">
              {t("Audit Site", "موقع التدقيق")}
            </InputLabel>
            <Select
              labelId="audit-site-label"
              label={t("Audit Site", "موقع التدقيق")}
              value={siteId ?? ""}
              onChange={(event) => setSelected(Number(event.target.value))}
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
        {!sites.isPending && !sites.isError && !siteId ? (
          <Alert severity="info">
            {t(
              "Select a Site to load its customer-bound Audit Log.",
              "اختر موقعًا لتحميل سجل التدقيق المرتبط بالعميل.",
            )}
          </Alert>
        ) : null}
        {events.isPending && siteId ? (
          <CircularProgress
            aria-label={t("Loading audit events", "جارٍ تحميل أحداث التدقيق")}
          />
        ) : null}
        {events.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void events.refetch()}>
                {t("Retry", "إعادة المحاولة")}
              </Button>
            }
          >
            {t("Unable to load Audit Log.", "تعذر تحميل سجل التدقيق.")}
          </Alert>
        ) : null}
        {!events.isPending &&
        !events.isError &&
        siteId &&
        events.data?.length === 0 ? (
          <Alert severity="info">
            {t(
              "No audit events exist for this Site.",
              "لا توجد أحداث تدقيق لهذا الموقع.",
            )}
          </Alert>
        ) : null}
        {events.data?.map((event) => (
          <Box key={event.id}>
            <Stack
              direction="row"
              spacing={1}
              sx={{ alignItems: "center", flexWrap: "wrap" }}
            >
              <Typography component="h3" variant="subtitle1">
                {event.action}
              </Typography>
              <Chip
                size="small"
                label={
                  language === "ar"
                    ? ((
                        {
                          SUCCESS: "ناجح",
                          DENIED: "مرفوض",
                          FAILURE: "فشل",
                        } as Record<string, string>
                      )[event.result] ?? event.result)
                    : event.result
                }
                color={
                  event.result === "SUCCESS"
                    ? "success"
                    : event.result === "DENIED"
                      ? "warning"
                      : "error"
                }
              />
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {event.actor.username} ({event.actor.role}) ·{" "}
              {event.target
                ? `${event.target.type}:${event.target.id}`
                : t("No target", "لا يوجد هدف")}{" "}
              · {new Date(event.occurredAt ?? event.createdAt).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
