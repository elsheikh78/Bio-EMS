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
import { userRoles, type ManagedUser } from "../administration/contracts";
import {
  useAuditEvents,
  useCreateUser,
  useManagedUsers,
  useUpdateUser,
  useUpdateUserPassword,
  useUpdateUserStatus,
} from "../administration/queries";
import { useSites } from "../monitoredAreas/queries";

export function AdministrationPage() {
  return (
    <Stack spacing={4}>
      <Box>
        <Typography variant="overline" color="primary.main">
          Administration &amp; accountability
        </Typography>
        <Typography component="h1" variant="h4">
          Users &amp; Audit Log
        </Typography>
        <Typography color="text.secondary">
          ADMIN-only identity lifecycle and immutable Site-scoped activity
          evidence.
        </Typography>
      </Box>
      <UsersPanel />
      <AuditPanel />
    </Stack>
  );
}

function UsersPanel() {
  const users = useManagedUsers();
  const status = useUpdateUserStatus();
  const [editing, setEditing] = useState<ManagedUser | "new">();
  const [passwordUser, setPasswordUser] = useState<ManagedUser>();
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography component="h2" variant="h5">
            User management
          </Typography>
          <Button variant="contained" onClick={() => setEditing("new")}>
            Add user
          </Button>
        </Box>
        {users.isPending ? (
          <CircularProgress aria-label="Loading users" />
        ) : null}
        {users.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void users.refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load users.
          </Alert>
        ) : null}
        {!users.isPending && !users.isError && users.data?.length === 0 ? (
          <Alert severity="info">No users are available.</Alert>
        ) : null}
        {status.isError ? (
          <Alert severity="error">User status could not be changed.</Alert>
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
                  label={user.status}
                  color={user.status === "active" ? "success" : "default"}
                />
              </Stack>
              <Typography color="text.secondary">
                {user.email ?? "No email"}
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Button
                aria-label={`Edit ${user.username}`}
                onClick={() => setEditing(user)}
              >
                Edit
              </Button>
              <Button
                aria-label={`Password ${user.username}`}
                onClick={() => setPasswordUser(user)}
              >
                Password
              </Button>
              <Button
                disabled={status.isPending}
                color={user.status === "active" ? "warning" : "success"}
                aria-label={`${user.status === "active" ? "Disable" : "Activate"} ${user.username}`}
                onClick={() =>
                  void status.mutateAsync({
                    id: user.id,
                    status: user.status === "active" ? "disabled" : "active",
                  })
                }
              >
                {user.status === "active" ? "Disable" : "Activate"}
              </Button>
            </Stack>
          </Box>
        ))}
      </Stack>
      {editing ? (
        <UserDialog
          user={editing === "new" ? undefined : editing}
          onClose={() => setEditing(undefined)}
        />
      ) : null}
      {passwordUser ? (
        <PasswordDialog
          user={passwordUser}
          onClose={() => setPasswordUser(undefined)}
        />
      ) : null}
    </Paper>
  );
}

function UserDialog({
  user,
  onClose,
}: {
  user?: ManagedUser;
  onClose: () => void;
}) {
  const create = useCreateUser();
  const update = useUpdateUser();
  const mutation = user ? update : create;
  const [username, setUsername] = useState(user?.username ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [role, setRole] = useState<(typeof userRoles)[number]>(
    user?.role ?? "VIEWER",
  );
  const [password, setPassword] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
    try {
      if (user)
        await update.mutateAsync({
          id: user.id,
          input: { email: email.trim() || null, role },
        });
      else
        await create.mutateAsync({
          username: username.trim().toLowerCase(),
          email: email.trim() || null,
          role,
          password,
        });
      onClose();
    } catch {
      /* mutation state renders error */
    }
  }
  return (
    <Dialog open fullWidth onClose={mutation.isPending ? undefined : onClose}>
      <Box component="form" onSubmit={(event) => void submit(event)}>
        <DialogTitle>{user ? `Edit ${user.username}` : "Add user"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {mutation.isError ? (
              <Alert severity="error">User could not be saved.</Alert>
            ) : null}
            <TextField
              required
              disabled={Boolean(user)}
              label="Username"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
            />
            <TextField
              type="email"
              label="Email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
            {!user ? (
              <TextField
                required
                type="password"
                label="Initial password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
              />
            ) : null}
            <FormControl>
              <InputLabel id="managed-role-label">Role</InputLabel>
              <Select
                labelId="managed-role-label"
                label="Role"
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
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Save user
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function PasswordDialog({
  user,
  onClose,
}: {
  user: ManagedUser;
  onClose: () => void;
}) {
  const mutation = useUpdateUserPassword();
  const [password, setPassword] = useState("");
  async function submit(event: FormEvent) {
    event.preventDefault();
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
        <DialogTitle>Change password for {user.username}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            {mutation.isError ? (
              <Alert severity="error">Password could not be changed.</Alert>
            ) : null}
            <Alert severity="info">
              Passwords are never displayed, logged, or returned.
            </Alert>
            <TextField
              required
              type="password"
              label="New password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="new-password"
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="contained">
            Change password
          </Button>
        </DialogActions>
      </Box>
    </Dialog>
  );
}

function AuditPanel() {
  const sites = useSites();
  const [selected, setSelected] = useState<number>();
  const siteId = selected;
  const events = useAuditEvents(siteId);
  return (
    <Paper component="section" variant="outlined" sx={{ p: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="h2" variant="h5">
            Audit Log
          </Typography>
          <Typography color="text.secondary">
            Newest immutable Site events. Structured prior/new values are
            deliberately omitted from this summary.
          </Typography>
        </Box>
        {sites.isPending ? (
          <CircularProgress aria-label="Loading audit Sites" />
        ) : null}
        {sites.isError ? (
          <Alert severity="error">Unable to load Sites for Audit Log.</Alert>
        ) : null}
        {(sites.data?.length ?? 0) > 0 ? (
          <FormControl>
            <InputLabel id="audit-site-label">Audit Site</InputLabel>
            <Select
              labelId="audit-site-label"
              label="Audit Site"
              value={siteId ?? ""}
              onChange={(event) => setSelected(Number(event.target.value))}
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
        {!sites.isPending && !sites.isError && !siteId ? (
          <Alert severity="info">
            Select a Site to load its customer-bound Audit Log.
          </Alert>
        ) : null}
        {events.isPending && siteId ? (
          <CircularProgress aria-label="Loading audit events" />
        ) : null}
        {events.isError ? (
          <Alert
            severity="error"
            action={
              <Button color="inherit" onClick={() => void events.refetch()}>
                Retry
              </Button>
            }
          >
            Unable to load Audit Log.
          </Alert>
        ) : null}
        {!events.isPending &&
        !events.isError &&
        siteId &&
        events.data?.length === 0 ? (
          <Alert severity="info">No audit events exist for this Site.</Alert>
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
                label={event.result}
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
                : "No target"}{" "}
              · {new Date(event.occurredAt ?? event.createdAt).toLocaleString()}
            </Typography>
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}
