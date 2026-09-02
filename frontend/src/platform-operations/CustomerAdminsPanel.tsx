import {
  Alert,
  Button,
  Card,
  CardContent,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import {
  useCreateCustomerAdmin,
  useCustomerAdmins,
  useCustomerAdminStatus,
} from "./customerAdmins";

export function CustomerAdminsPanel({ customerId }: { customerId: number }) {
  const admins = useCustomerAdmins(customerId);
  const create = useCreateCustomerAdmin(customerId);
  const status = useCustomerAdminStatus(customerId);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = async (e: FormEvent) => {
    e.preventDefault();
    await create.mutateAsync({ username, email: email || null, password });
    setUsername("");
    setEmail("");
    setPassword("");
  };
  return (
    <Card variant="outlined">
      <CardContent>
        <Typography component="h2" variant="h6">
          Customer administrators
        </Typography>
        <Typography color="text.secondary">
          Only SYSTEM_OWNER can create, disable or reset customer ADMIN
          accounts.
        </Typography>
        <Stack
          component="form"
          onSubmit={(e) => void submit(e)}
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          sx={{ my: 2 }}
        >
          <TextField
            required
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <TextField
            required
            label="Initial password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            slotProps={{ htmlInput: { minLength: 12 } }}
          />
          <Button type="submit" variant="contained" disabled={create.isPending}>
            Add ADMIN
          </Button>
        </Stack>
        {create.isError ? (
          <Alert severity="error">ADMIN could not be created.</Alert>
        ) : null}
        {admins.data?.map((admin) => (
          <Stack
            key={admin.id}
            direction="row"
            spacing={2}
            sx={{ alignItems: "center", my: 1 }}
          >
            <Typography sx={{ flexGrow: 1 }}>
              {admin.username} — {admin.email ?? "no email"} — {admin.status}
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
              {admin.status === "active" ? "Disable" : "Enable"}
            </Button>
          </Stack>
        ))}
      </CardContent>
    </Card>
  );
}
