import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useDashboardSummary } from "../dashboard/queries";
import { useLocalization } from "../localization/useLocalization";

export function DashboardPage() {
  const { resources } = useLocalization();
  const summaryQuery = useDashboardSummary();

  return (
    <Stack spacing={3}>
      <Box>
        <Typography component="h1" variant="h4">
          {resources.dashboard.title}
        </Typography>

        <Typography color="text.secondary">
          {resources.dashboard.description}
        </Typography>
      </Box>

      {summaryQuery.isPending ? (
        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
          }}
        >
          <CircularProgress size={24} />
          <Typography>{resources.dashboard.loading}</Typography>
        </Box>
      ) : null}

      {summaryQuery.isError ? (
        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void summaryQuery.refetch()}
            >
              {resources.dashboard.retry}
            </Button>
          }
        >
          {resources.dashboard.error}
        </Alert>
      ) : null}

      {summaryQuery.data ? (
        <Box
          component="section"
          aria-label={resources.dashboard.title}
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <SummaryCard
            label={resources.dashboard.summary.totalSites}
            value={summaryQuery.data.totalSites}
          />

          <SummaryCard
            label={resources.dashboard.summary.totalRooms}
            value={summaryQuery.data.totalRooms}
          />

          <SummaryCard
            label={resources.dashboard.summary.totalDevices}
            value={summaryQuery.data.totalDevices}
          />

          <SummaryCard
            label={resources.dashboard.summary.totalSensors}
            value={summaryQuery.data.totalSensors}
          />

          <SummaryCard
            label={resources.dashboard.summary.activeAlarms}
            value={summaryQuery.data.activeAlarms}
          />

          <SummaryCard
            label={resources.dashboard.summary.offlineDevices}
            value={summaryQuery.data.offlineDevices}
          />
        </Box>
      ) : null}
    </Stack>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>

      <Typography component="p" variant="h4" sx={{ mt: 1 }}>
        {value}
      </Typography>
    </Paper>
  );
}
