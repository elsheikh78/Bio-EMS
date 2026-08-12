import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type {
  DashboardRoomStatus,
  DashboardSensorStatus,
} from "../dashboard/contracts";
import {
  useDashboardRoomStatuses,
  useDashboardSummary,
} from "../dashboard/queries";
import { useLocalization } from "../localization/useLocalization";

type DashboardResources = ReturnType<
  typeof useLocalization
>["resources"]["dashboard"];

export function DashboardPage() {
  const { resources } = useLocalization();
  const summaryQuery = useDashboardSummary();
  const roomStatusesQuery = useDashboardRoomStatuses();

  return (
    <Stack spacing={4}>
      <Box>
        <Typography component="h1" variant="h4">
          {resources.dashboard.title}
        </Typography>

        <Typography color="text.secondary">
          {resources.dashboard.description}
        </Typography>
      </Box>

      <DashboardSummarySection
        query={summaryQuery}
        resources={resources.dashboard}
      />

      <RoomStatusSection
        query={roomStatusesQuery}
        resources={resources.dashboard}
      />
    </Stack>
  );
}

interface DashboardSummarySectionProps {
  query: ReturnType<typeof useDashboardSummary>;
  resources: DashboardResources;
}

function DashboardSummarySection({
  query,
  resources,
}: DashboardSummarySectionProps) {
  if (query.isPending) {
    return <LoadingState label={resources.loading} />;
  }

  if (query.isError) {
    return (
      <Alert
        severity="error"
        action={
          <Button
            color="inherit"
            size="small"
            onClick={() => void query.refetch()}
          >
            {resources.retry}
          </Button>
        }
      >
        {resources.error}
      </Alert>
    );
  }

  if (!query.data) {
    return null;
  }

  return (
    <Box
      component="section"
      aria-label={resources.title}
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
        label={resources.summary.totalSites}
        value={query.data.totalSites}
      />

      <SummaryCard
        label={resources.summary.totalRooms}
        value={query.data.totalRooms}
      />

      <SummaryCard
        label={resources.summary.totalDevices}
        value={query.data.totalDevices}
      />

      <SummaryCard
        label={resources.summary.totalSensors}
        value={query.data.totalSensors}
      />

      <SummaryCard
        label={resources.summary.activeAlarms}
        value={query.data.activeAlarms}
      />

      <SummaryCard
        label={resources.summary.offlineDevices}
        value={query.data.offlineDevices}
      />
    </Box>
  );
}

interface RoomStatusSectionProps {
  query: ReturnType<typeof useDashboardRoomStatuses>;
  resources: DashboardResources;
}

function RoomStatusSection({ query, resources }: RoomStatusSectionProps) {
  return (
    <Box component="section" aria-labelledby="dashboard-room-status-title">
      <Stack spacing={2}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            id="dashboard-room-status-title"
          >
            {resources.rooms.title}
          </Typography>

          <Typography color="text.secondary">
            {resources.rooms.description}
          </Typography>
        </Box>

        {query.isPending ? (
          <LoadingState label={resources.rooms.loading} />
        ) : null}

        {query.isError ? (
          <Alert
            severity="error"
            action={
              <Button
                color="inherit"
                size="small"
                onClick={() => void query.refetch()}
              >
                {resources.retry}
              </Button>
            }
          >
            {resources.rooms.error}
          </Alert>
        ) : null}

        {query.data?.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography color="text.secondary">
              {resources.rooms.empty}
            </Typography>
          </Paper>
        ) : null}

        {query.data && query.data.length > 0 ? (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {query.data.map((room) => (
              <RoomStatusCard
                key={room.roomId}
                room={room}
                resources={resources}
              />
            ))}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

interface RoomStatusCardProps {
  room: DashboardRoomStatus;
  resources: DashboardResources;
}

function RoomStatusCard({ room, resources }: RoomStatusCardProps) {
  return (
    <Paper variant="outlined" sx={{ p: 2.5 }}>
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box>
            <Typography component="h3" variant="h6">
              {room.roomName}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {room.siteName}
            </Typography>
          </Box>

          <Chip
            size="small"
            label={
              room.online ? resources.rooms.online : resources.rooms.offline
            }
            color={room.online ? "success" : "default"}
            variant={room.online ? "filled" : "outlined"}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          <SensorReading
            label={resources.rooms.temperature}
            value={
              room.temperature === null
                ? resources.rooms.unavailable
                : `${room.temperature} °C`
            }
            status={room.temperatureStatus}
            resources={resources}
          />

          <SensorReading
            label={resources.rooms.humidity}
            value={
              room.humidity === null
                ? resources.rooms.unavailable
                : `${room.humidity} %`
            }
            status={room.humidityStatus}
            resources={resources}
          />
        </Box>

        <Typography variant="body2">
          {resources.rooms.activeAlarms}: <strong>{room.activeAlarms}</strong>
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {resources.rooms.lastUpdate}:{" "}
          {room.lastUpdate ?? resources.rooms.unavailable}
        </Typography>
      </Stack>
    </Paper>
  );
}

interface SensorReadingProps {
  label: string;
  value: string;
  status: DashboardSensorStatus;
  resources: DashboardResources;
}

function SensorReading({
  label,
  value,
  status,
  resources,
}: SensorReadingProps) {
  const color: "success" | "warning" | "error" | "default" =
    status === "NORMAL"
      ? "success"
      : status === "WARNING"
        ? "warning"
        : status === "CRITICAL"
          ? "error"
          : "default";

  return (
    <Stack spacing={0.75}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="h6">{value}</Typography>

      <Chip
        size="small"
        label={resources.rooms.status[status]}
        color={color}
        variant="outlined"
        sx={{ alignSelf: "flex-start" }}
      />
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

interface LoadingStateProps {
  label: string;
}

function LoadingState({ label }: LoadingStateProps) {
  return (
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
      <Typography>{label}</Typography>
    </Box>
  );
}
