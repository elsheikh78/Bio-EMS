import {
  Button,
  Container,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { Link } from "react-router-dom";
import { CommunicationChannelsPanel } from "../communication-channels/CommunicationChannelsPanel";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";
import { usePlatformOperationsOverview } from "../platform-operations/queries";

export function SystemOwnerCommunicationChannelsPage() {
  const { apiClient } = usePlatformAuthentication();
  const overview = usePlatformOperationsOverview();
  const [customerId, setCustomerId] = useState<number | "">("");
  const request = <T,>(path: `/${string}`, options = {}) =>
    apiClient.request<T>(path, { ...options, auth: "protected" });
  return (
    <Container component="main" maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Button component={Link} to="/system-owner">
          Back to owner console
        </Button>
        <Typography component="h1" variant="h4">
          Customer communication channels
        </Typography>
        <TextField
          select
          label="Customer"
          value={customerId}
          onChange={(event) => setCustomerId(Number(event.target.value))}
        >
          <MenuItem value="" disabled>
            Choose a customer
          </MenuItem>
          {(overview.data?.customers ?? []).map((customer) => (
            <MenuItem key={customer.id} value={customer.id}>
              {customer.code} — {customer.name}
            </MenuItem>
          ))}
        </TextField>
        {customerId ? (
          <CommunicationChannelsPanel
            request={request}
            basePath={`/platform-operations/customers/${customerId}/communication-channels`}
            sites={(overview.data?.sites ?? []).filter((site) =>
              (overview.data?.siteBoundLicensing.installations ?? []).some(
                (installation) =>
                  installation.customerId === customerId &&
                  installation.siteId === site.id,
              ),
            )}
          />
        ) : null}
      </Stack>
    </Container>
  );
}
