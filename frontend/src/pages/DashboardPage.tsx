import { useState } from "react";
import { Link as RouterLink } from "react-router-dom";
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
  DashboardAlarmStatistics,
  DashboardRoomStatus,
  DashboardSensorStatus,
  LatestTelemetryRecord,
} from "../dashboard/contracts";
import {
  useDashboardAlarmStatistics,
  useDashboardRoomStatuses,
  useDashboardSummary,
  useLatestTelemetry,
} from "../dashboard/queries";
import { OperationalOverview } from "../dashboard/DashboardVisuals";
import {
  roomOperationalPriority,
  roomPriorityTone,
} from "../dashboard/roomPriority";
import { useLocalization } from "../localization/useLocalization";

type DashboardResources = ReturnType<
  typeof useLocalization
>["resources"]["dashboard"];

export function DashboardPage() {
  const { resources } = useLocalization();
  const summaryQuery = useDashboardSummary();
  const roomStatusesQuery = useDashboardRoomStatuses();
  const latestTelemetryQuery = useLatestTelemetry();
  const alarmStatisticsQuery = useDashboardAlarmStatistics();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const requiresAttention = Boolean(
    summaryQuery.data &&
    (summaryQuery.data.activeAlarms > 0 ||
      summaryQuery.data.offlineDevices > 0 ||
      summaryQuery.data.staleDevices > 0),
  );

  async function refreshDashboard() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await Promise.all([
        summaryQuery.refetch(),
        roomStatusesQuery.refetch(),
        latestTelemetryQuery.refetch(),
        alarmStatisticsQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <Stack spacing={{ xs: 3, md: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: {
            xs: "stretch",
            sm: "flex-start",
          },
          flexDirection: {
            xs: "column",
            sm: "row",
          },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            component="h1"
            variant="h4"
            sx={{ letterSpacing: "-0.02em" }}
          >
            {resources.dashboard.title}
          </Typography>

          <Typography color="text.secondary" variant="body2">
            {resources.dashboard.description}
          </Typography>
        </Box>

        <Button
          variant="contained"
          onClick={() => void refreshDashboard()}
          disabled={isRefreshing}
          sx={{
            alignSelf: {
              xs: "stretch",
              sm: "flex-start",
            },
            whiteSpace: "nowrap",
          }}
        >
          {isRefreshing
            ? resources.dashboard.refreshing
            : resources.dashboard.refresh}
        </Button>
      </Box>

      <Paper
        variant="outlined"
        sx={{
          px: { xs: 3, md: 4 },
          py: 2,
          bgcolor: "action.hover",
          borderRadius: 3,
          display: "flex",
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          flexDirection: { xs: "column", sm: "row" },
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            sx={{ color: "text.secondary", letterSpacing: 0.8 }}
          >
            {resources.dashboard.compact.scope}
          </Typography>
          <Typography sx={{ fontWeight: 700 }}>
            {resources.dashboard.compact.customerName}
          </Typography>
        </Box>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Chip
            color={requiresAttention ? "warning" : "success"}
            label={
              requiresAttention
                ? resources.dashboard.compact.attention
                : resources.dashboard.compact.healthy
            }
            size="small"
            variant="outlined"
          />
          <Typography variant="caption" color="text.secondary">
            ● {resources.dashboard.compact.liveEvidence}
          </Typography>
          <Button
            component={RouterLink}
            size="small"
            to="/live-board"
            variant="outlined"
          >
            {resources.dashboard.compact.openAreas}
          </Button>
        </Stack>
      </Paper>

      <DashboardSummarySection
        query={summaryQuery}
        resources={resources.dashboard}
      />

      {latestTelemetryQuery.data && latestTelemetryQuery.data.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(0, 2fr) minmax(300px, 1fr)",
            },
            gap: 3,
          }}
        >
          <CurrentTelemetryProfile
            records={latestTelemetryQuery.data}
            resources={resources.dashboard}
          />
          <PriorityAreasPanel
            rooms={roomStatusesQuery.data ?? []}
            resources={resources.dashboard}
          />
        </Box>
      ) : null}

      {summaryQuery.data || alarmStatisticsQuery.data ? (
        <OperationalOverview
          summary={summaryQuery.data}
          alarmStatistics={alarmStatisticsQuery.data}
          labels={resources.dashboard.operationalOverview!}
        />
      ) : null}

      <Box
        component="section"
        aria-label={resources.dashboard.compact.detailedEvidence}
        sx={{ display: "grid", gap: 4 }}
      >
        <RoomStatusSection
          query={roomStatusesQuery}
          resources={resources.dashboard}
        />

        <LatestTelemetrySection
          query={latestTelemetryQuery}
          resources={resources.dashboard}
        />

        <AlarmStatisticsSection
          query={alarmStatisticsQuery}
          resources={resources.dashboard}
        />
      </Box>
    </Stack>
  );
}

function CurrentTelemetryProfile({
  records,
  resources,
}: {
  records: LatestTelemetryRecord[];
  resources: DashboardResources;
}) {
  const temperatureRecords = records.filter(
    (record) =>
      record.unit.toLowerCase().includes("c") ||
      record.sensorType.toLowerCase().includes("temp"),
  );
  const visibleRecords = (
    temperatureRecords.length > 0 ? temperatureRecords : records
  ).slice(0, 8);
  const values = visibleRecords.map((record) => record.value);
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const span = Math.max(maximum - minimum, 1);
  const points = visibleRecords
    .map((record, index) => {
      const x =
        visibleRecords.length === 1
          ? 50
          : 6 + (index / (visibleRecords.length - 1)) * 88;
      const y = 78 - ((record.value - minimum) / span) * 56;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Paper
      component="section"
      aria-label={resources.latestTelemetry.title}
      variant="outlined"
      sx={{
        p: { xs: 3, md: 4 },
        borderRadius: 3,
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography component="p" variant="h5">
            {resources.compact.currentProfile}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {resources.compact.currentProfileDescription}
          </Typography>
        </Box>
        <Box sx={{ minHeight: 164 }}>
          <Box
            component="svg"
            viewBox="0 0 100 100"
            role="img"
            aria-label={resources.compact.currentProfileAria}
            preserveAspectRatio="none"
            sx={{ width: "100%", height: 145, overflow: "visible" }}
          >
            {[22, 50, 78].map((y) => (
              <line
                key={y}
                x1="4"
                x2="96"
                y1={y}
                y2={y}
                stroke="#E3ECEE"
                strokeWidth="0.6"
              />
            ))}
            <polyline
              points={points}
              fill="none"
              stroke="#0B6B78"
              strokeWidth="1.6"
              vectorEffect="non-scaling-stroke"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {visibleRecords.map((record, index) => {
              const [x, y] = points.split(" ")[index].split(",");
              return (
                <circle
                  key={`${record.device}-${record.sensor}`}
                  cx={x}
                  cy={y}
                  r="1.4"
                  fill="#18A6A6"
                  stroke="#FFFFFF"
                  strokeWidth="0.6"
                />
              );
            })}
          </Box>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: `repeat(${visibleRecords.length}, minmax(0, 1fr))`,
              gap: 1,
            }}
          >
            {visibleRecords.map((record) => (
              <Box
                key={`${record.device}-${record.sensor}-${record.time}`}
                sx={{ textAlign: "center", minWidth: 0 }}
              >
                <Typography
                  variant="caption"
                  noWrap
                  sx={{ display: "block", fontWeight: 700 }}
                >
                  {record.sensor}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {record.value}
                  {record.unit}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
        <Typography variant="caption" color="text.secondary">
          {visibleRecords.length} {resources.compact.readingsDisplayed}
        </Typography>
      </Stack>
    </Paper>
  );
}

function PriorityAreasPanel({
  rooms,
  resources,
}: {
  rooms: DashboardRoomStatus[];
  resources: DashboardResources;
}) {
  const prioritized = [...rooms]
    .sort(
      (first, second) =>
        Number(first.online) - Number(second.online) ||
        roomOperationalPriority(second) - roomOperationalPriority(first) ||
        second.activeAlarms - first.activeAlarms,
    )
    .slice(0, 3);

  return (
    <Paper variant="outlined" sx={{ p: { xs: 3, md: 4 }, borderRadius: 3 }}>
      <Stack spacing={3}>
        <Box>
          <Typography component="p" variant="h5">
            {resources.compact.priorityAreas}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {resources.compact.priorityDescription}
          </Typography>
        </Box>
        {prioritized.length === 0 ? (
          <Typography color="text.secondary">
            {resources.rooms.empty}
          </Typography>
        ) : (
          prioritized.map((room) => {
            const tone = roomPriorityTone(room);
            return (
              <Box
                key={room.roomId}
                sx={{
                  p: 2.5,
                  borderRadius: 2.5,
                  border: 1,
                  borderColor: "divider",
                  borderInlineStart: 4,
                  borderInlineStartColor: tone,
                }}
              >
                <Stack
                  direction="row"
                  sx={{
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                  }}
                  spacing={3}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Typography noWrap sx={{ fontWeight: 700 }}>
                      {room.roomName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {room.siteName}
                    </Typography>
                  </Box>
                  <Typography
                    sx={{ color: tone, fontWeight: 800, whiteSpace: "nowrap" }}
                  >
                    {room.temperature === null
                      ? resources.rooms.unavailable
                      : `${room.temperature} °C`}
                  </Typography>
                </Stack>
              </Box>
            );
          })
        )}
      </Stack>
    </Paper>
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
          xl: "repeat(6, minmax(0, 1fr))",
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
        tone={query.data.activeAlarms > 0 ? "error" : "neutral"}
      />

      <SummaryCard
        label={resources.summary.offlineDevices}
        value={query.data.offlineDevices}
        tone={query.data.offlineDevices > 0 ? "warning" : "neutral"}
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
    <Paper
      variant="outlined"
      sx={{
        p: 5,
        borderRadius: 3.5,
        boxShadow: "0 8px 24px rgba(7, 59, 76, 0.06)",
        borderInlineStart: 4,
        borderInlineStartColor: room.online ? "success.main" : "error.main",
      }}
    >
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

interface LatestTelemetrySectionProps {
  query: ReturnType<typeof useLatestTelemetry>;
  resources: DashboardResources;
}

function LatestTelemetrySection({
  query,
  resources,
}: LatestTelemetrySectionProps) {
  return (
    <Box component="section" aria-labelledby="dashboard-latest-telemetry-title">
      <Stack spacing={2}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            id="dashboard-latest-telemetry-title"
          >
            {resources.latestTelemetry.title}
          </Typography>

          <Typography color="text.secondary">
            {resources.latestTelemetry.description}
          </Typography>
        </Box>

        {query.isPending ? (
          <LoadingState label={resources.latestTelemetry.loading} />
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
            {resources.latestTelemetry.error}
          </Alert>
        ) : null}

        {query.data?.length === 0 ? (
          <Paper variant="outlined" sx={{ p: 2.5 }}>
            <Typography color="text.secondary">
              {resources.latestTelemetry.empty}
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
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {query.data.map((record) => (
              <LatestTelemetryCard
                key={`${record.device}-${record.sensor}-${record.time}`}
                record={record}
                resources={resources}
              />
            ))}
          </Box>
        ) : null}
      </Stack>
    </Box>
  );
}

interface LatestTelemetryCardProps {
  record: LatestTelemetryRecord;
  resources: DashboardResources;
}

function LatestTelemetryCard({ record, resources }: LatestTelemetryCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 5,
        borderRadius: 3.5,
        boxShadow: "0 8px 24px rgba(7, 59, 76, 0.06)",
      }}
    >
      <Stack spacing={2}>
        <Box>
          <Typography component="h3" variant="h6">
            {record.sensor}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            {record.sensorType}
          </Typography>
        </Box>

        <Typography component="p" variant="h4">
          {record.value} {record.unit}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          <TelemetryMetadata
            label={resources.latestTelemetry.site}
            value={record.site}
          />

          <TelemetryMetadata
            label={resources.latestTelemetry.device}
            value={record.device}
          />
        </Box>

        <Typography variant="caption" color="text.secondary">
          {resources.latestTelemetry.time}: {record.time}
        </Typography>
      </Stack>
    </Paper>
  );
}

interface TelemetryMetadataProps {
  label: string;
  value: string;
}

function TelemetryMetadata({ label, value }: TelemetryMetadataProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

interface AlarmStatisticsSectionProps {
  query: ReturnType<typeof useDashboardAlarmStatistics>;
  resources: DashboardResources;
}

function AlarmStatisticsSection({
  query,
  resources,
}: AlarmStatisticsSectionProps) {
  return (
    <Box component="section" aria-labelledby="dashboard-alarm-statistics-title">
      <Stack spacing={2}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            id="dashboard-alarm-statistics-title"
          >
            {resources.alarmStatistics.title}
          </Typography>

          <Typography color="text.secondary">
            {resources.alarmStatistics.description}
          </Typography>
        </Box>

        {query.isPending ? (
          <LoadingState label={resources.alarmStatistics.loading} />
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
            {resources.alarmStatistics.error}
          </Alert>
        ) : null}

        {query.data ? (
          <AlarmStatisticsContent
            statistics={query.data}
            resources={resources}
          />
        ) : null}
      </Stack>
    </Box>
  );
}

interface AlarmStatisticsContentProps {
  statistics: DashboardAlarmStatistics;
  resources: DashboardResources;
}

function AlarmStatisticsContent({
  statistics,
  resources,
}: AlarmStatisticsContentProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "repeat(2, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      <AlarmStatisticsGroup
        title={resources.alarmStatistics.lifecycle.title}
        items={[
          {
            label: resources.alarmStatistics.lifecycle.active,
            value: statistics.active,
          },
          {
            label: resources.alarmStatistics.lifecycle.acknowledged,
            value: statistics.acknowledged,
          },
          {
            label: resources.alarmStatistics.lifecycle.recovered,
            value: statistics.recovered,
          },
        ]}
      />

      <AlarmStatisticsGroup
        title={resources.alarmStatistics.severity.title}
        items={[
          {
            label: resources.alarmStatistics.severity.critical,
            value: statistics.critical,
          },
          {
            label: resources.alarmStatistics.severity.warning,
            value: statistics.warning,
          },
          {
            label: resources.alarmStatistics.severity.info,
            value: statistics.info,
          },
        ]}
      />
    </Box>
  );
}

interface AlarmStatisticItem {
  label: string;
  value: number;
}

interface AlarmStatisticsGroupProps {
  title: string;
  items: AlarmStatisticItem[];
}

function AlarmStatisticsGroup({ title, items }: AlarmStatisticsGroupProps) {
  return (
    <Paper variant="outlined" sx={{ p: 5, borderRadius: 3.5 }}>
      <Stack spacing={2}>
        <Typography component="h3" variant="h6">
          {title}
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {items.map((item) => (
            <Box key={item.label}>
              <Typography variant="body2" color="text.secondary">
                {item.label}
              </Typography>

              <Typography component="p" variant="h4" sx={{ mt: 0.5 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Paper>
  );
}

interface SummaryCardProps {
  label: string;
  value: number;
  tone?: "neutral" | "warning" | "error";
}

function SummaryCard({ label, value, tone = "neutral" }: SummaryCardProps) {
  const accent =
    tone === "error"
      ? "error.main"
      : tone === "warning"
        ? "warning.main"
        : "primary.main";

  return (
    <Paper
      variant="outlined"
      sx={{
        position: "relative",
        minHeight: 88,
        p: 3,
        borderRadius: 3,
        overflow: "hidden",
        borderColor: "divider",
        boxShadow: "0 10px 30px rgba(7, 59, 76, 0.07)",
        "&::before": {
          content: '""',
          position: "absolute",
          insetBlock: 0,
          insetInlineStart: 0,
          width: 5,
          bgcolor: accent,
        },
      }}
    >
      <Typography
        color="text.secondary"
        variant="caption"
        sx={{ textTransform: "uppercase", letterSpacing: 0.6 }}
      >
        {label}
      </Typography>

      <Typography
        component="p"
        variant="h4"
        sx={{
          mt: 1,
          color: tone === "neutral" ? "text.primary" : accent,
          fontVariantNumeric: "tabular-nums",
        }}
      >
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
