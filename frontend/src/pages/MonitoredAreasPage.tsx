import { useState } from "react";
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
import { useLocalization } from "../localization/useLocalization";
import type { DashboardRoomStatus } from "../dashboard/contracts";
import { useDashboardRoomStatuses } from "../dashboard/queries";
import type { Room, Sensor, Site } from "../monitoredAreas/contracts";
import { useRooms, useSensors, useSites } from "../monitoredAreas/queries";

type MonitoredAreasResources = ReturnType<
  typeof useLocalization
>["resources"]["monitoredAreas"];

export function MonitoredAreasPage() {
  const { resources } = useLocalization();
  const copy = resources.monitoredAreas;

  const sitesQuery = useSites();
  const roomsQuery = useRooms();
  const sensorsQuery = useSensors();
  const operationalStatusQuery = useDashboardRoomStatuses();

  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshMonitoredAreas() {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await Promise.all([
        sitesQuery.refetch(),
        roomsQuery.refetch(),
        sensorsQuery.refetch(),
        operationalStatusQuery.refetch(),
      ]);
    } finally {
      setIsRefreshing(false);
    }
  }

  if (sitesQuery.isLoading || roomsQuery.isLoading || sensorsQuery.isLoading) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />

        <Box
          role="status"
          aria-live="polite"
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
          }}
        >
          <CircularProgress size={24} />
          <Typography>{copy.loading}</Typography>
        </Box>
      </Stack>
    );
  }

  if (sitesQuery.isError || roomsQuery.isError || sensorsQuery.isError) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />

        <Alert
          severity="error"
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => void refreshMonitoredAreas()}
              disabled={isRefreshing}
            >
              {isRefreshing ? copy.refreshing : copy.retry}
            </Button>
          }
        >
          {copy.error}
        </Alert>
      </Stack>
    );
  }

  const sites = sitesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const sensors = sensorsQuery.data ?? [];

  return (
    <Stack spacing={4}>
      <PageHeader
        copy={copy}
        isRefreshing={isRefreshing}
        onRefresh={() => void refreshMonitoredAreas()}
      />

      {operationalStatusQuery.isError ? (
        <Alert severity="warning">
          Configuration is available, but current telemetry status could not be
          loaded.
        </Alert>
      ) : null}

      {sites.length === 0 ? (
        <Alert severity="info">{copy.noSites}</Alert>
      ) : (
        <Stack spacing={3}>
          {sites.map((site) => (
            <SiteSection
              key={site.id ?? site.code}
              site={site}
              rooms={rooms}
              sensors={sensors}
              roomStatuses={operationalStatusQuery.data ?? []}
              copy={copy}
            />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

interface PageHeaderProps {
  copy: MonitoredAreasResources;
  isRefreshing: boolean;
  onRefresh: () => void;
}

function PageHeader({ copy, isRefreshing, onRefresh }: PageHeaderProps) {
  return (
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
      <PageHeading title={copy.title} description={copy.description} />

      <Button
        variant="outlined"
        onClick={onRefresh}
        disabled={isRefreshing}
        sx={{
          alignSelf: {
            xs: "stretch",
            sm: "flex-start",
          },
          whiteSpace: "nowrap",
        }}
      >
        {isRefreshing ? copy.refreshing : copy.refresh}
      </Button>
    </Box>
  );
}

interface PageHeadingProps {
  title: string;
  description: string;
}

function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <Box>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>

      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}

interface SiteSectionProps {
  site: Site;
  rooms: Room[];
  sensors: Sensor[];
  roomStatuses: DashboardRoomStatus[];
  copy: MonitoredAreasResources;
}

function SiteSection({
  site,
  rooms,
  sensors,
  roomStatuses,
  copy,
}: SiteSectionProps) {
  const siteRooms =
    site.id === undefined
      ? []
      : rooms.filter((room) => room.site_id === site.id);

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        p: 3,
      }}
    >
      <Stack spacing={3}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1,
          }}
        >
          <Box>
            <Typography component="h2" variant="h5">
              {site.name}
            </Typography>

            <Typography color="text.secondary">{site.code}</Typography>

            {site.location ? (
              <Typography variant="body2" color="text.secondary">
                {site.location}
              </Typography>
            ) : null}
          </Box>

          <ConfigurationStateChip
            value={site.active}
            activeLabel={copy.site.active}
            inactiveLabel={copy.site.inactive}
          />
        </Box>

        {siteRooms.length === 0 ? (
          <Alert severity="info">{copy.noAreas}</Alert>
        ) : (
          <Stack spacing={2}>
            {siteRooms.map((room) => (
              <RoomSection
                key={room.id ?? room.uuid}
                room={room}
                sensors={sensors}
                operationalStatus={roomStatuses.find(
                  (status) => status.roomId === room.id,
                )}
                copy={copy}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

interface RoomSectionProps {
  room: Room;
  sensors: Sensor[];
  operationalStatus?: DashboardRoomStatus;
  copy: MonitoredAreasResources;
}

function RoomSection({
  room,
  sensors,
  operationalStatus,
  copy,
}: RoomSectionProps) {
  const roomSensors =
    room.id === undefined
      ? []
      : sensors.filter((sensor) => sensor.room_id === room.id);

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{
        p: 2,
      }}
    >
      <Stack spacing={2}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1,
          }}
        >
          <Box>
            <Typography component="h3" variant="h6">
              {room.name}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              {room.code}
            </Typography>

            {room.description ? (
              <Typography variant="body2" color="text.secondary">
                {room.description}
              </Typography>
            ) : null}
          </Box>

          <ConfigurationStateChip
            value={room.active}
            activeLabel={copy.area.active}
            inactiveLabel={copy.area.inactive}
          />
        </Box>

        <OperationalRoomStatus status={operationalStatus} />

        {roomSensors.length === 0 ? (
          <Alert severity="info">{copy.noSensors}</Alert>
        ) : (
          <Stack spacing={1.5}>
            {roomSensors.map((sensor) => (
              <SensorRow
                key={sensor.id ?? sensor.uuid}
                sensor={sensor}
                copy={copy}
              />
            ))}
          </Stack>
        )}
      </Stack>
    </Paper>
  );
}

function OperationalRoomStatus({ status }: { status?: DashboardRoomStatus }) {
  const { language, resources } = useLocalization();
  const roomCopy = resources.dashboard.rooms;
  if (!status) {
    return (
      <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
        <Typography color="text.secondary">
          {language === "ar"
            ? "لا توجد لقطة قراءات حالية متاحة لهذه المنطقة."
            : "No current telemetry snapshot is available for this area."}
        </Typography>
      </Paper>
    );
  }

  const severity = status.online
    ? status.temperatureStatus === "CRITICAL"
      ? "error"
      : status.temperatureStatus === "WARNING"
        ? "warning"
        : "success"
    : "error";

  return (
    <Paper variant="outlined" sx={{ p: 2, bgcolor: "background.default" }}>
      <Stack spacing={1.5}>
        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
          <Chip
            size="small"
            color={status.online ? "success" : "error"}
            label={status.online ? roomCopy.online : roomCopy.offline}
          />
          <Chip
            size="small"
            color={severity}
            label={`${roomCopy.temperature}: ${roomCopy.status[status.temperatureStatus]}`}
          />
          <Chip
            size="small"
            color={status.activeAlarms > 0 ? "error" : "default"}
            label={`${status.activeAlarms} ${roomCopy.activeAlarms}`}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(3, minmax(0, 1fr))" },
            gap: 1,
          }}
        >
          <MetadataItem
            label={resources.dashboard.rooms.temperature}
            value={
              status.temperature === null
                ? roomCopy.unavailable
                : `${status.temperature} °C`
            }
          />
          <MetadataItem
            label={resources.dashboard.rooms.humidity}
            value={
              status.humidity === null
                ? roomCopy.unavailable
                : `${status.humidity} %RH`
            }
          />
          <MetadataItem
            label={resources.dashboard.rooms.lastUpdate}
            value={status.lastUpdate ?? roomCopy.unavailable}
          />
        </Box>
      </Stack>
    </Paper>
  );
}

interface SensorRowProps {
  sensor: Sensor;
  copy: MonitoredAreasResources;
}

function SensorRow({ sensor, copy }: SensorRowProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
      }}
    >
      <Stack
        spacing={2}
        sx={{
          minWidth: 0,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: {
              xs: "flex-start",
              sm: "center",
            },
            flexDirection: {
              xs: "column",
              sm: "row",
            },
            gap: 1,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 600 }}>{sensor.name}</Typography>

            <Typography variant="body2" color="text.secondary">
              {sensor.code}
            </Typography>
          </Box>

          <ConfigurationStateChip
            value={sensor.enabled}
            activeLabel={copy.sensor.enabled}
            inactiveLabel={copy.sensor.disabled}
          />
          <Chip
            size="small"
            variant="outlined"
            label={`Calibration: ${sensor.calibration_status ?? "NOT_CALIBRATED"}`}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1,
          }}
        >
          <MetadataItem label={copy.sensor.type} value={sensor.sensor_type} />

          <MetadataItem label={copy.sensor.unit} value={sensor.unit} />

          <MetadataItem
            label={copy.sensor.channel}
            value={String(sensor.channel)}
          />
        </Box>

        <ThresholdConfiguration sensor={sensor} copy={copy.sensor.thresholds} />
      </Stack>
    </Paper>
  );
}

interface ThresholdConfigurationProps {
  sensor: Sensor;
  copy: MonitoredAreasResources["sensor"]["thresholds"];
}

function ThresholdConfiguration({ sensor, copy }: ThresholdConfigurationProps) {
  return (
    <Box
      component="section"
      aria-label={copy.title}
      sx={{
        borderTop: 1,
        borderColor: "divider",
        pt: 2,
      }}
    >
      <Stack spacing={1.5}>
        <Box>
          <Typography variant="subtitle2">{copy.title}</Typography>

          <Typography variant="caption" color="text.secondary">
            {copy.description}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 1.5,
          }}
        >
          <MetadataItem
            label={copy.minValue}
            value={formatConfiguredValue(
              sensor.min_value,
              sensor.unit,
              copy.notConfigured,
            )}
          />

          <MetadataItem
            label={copy.warningLow}
            value={formatConfiguredValue(
              sensor.warning_low,
              sensor.unit,
              copy.notConfigured,
            )}
          />

          <MetadataItem
            label={copy.alarmLow}
            value={formatConfiguredValue(
              sensor.alarm_low,
              sensor.unit,
              copy.notConfigured,
            )}
          />

          <MetadataItem
            label={copy.warningHigh}
            value={formatConfiguredValue(
              sensor.warning_high,
              sensor.unit,
              copy.notConfigured,
            )}
          />

          <MetadataItem
            label={copy.alarmHigh}
            value={formatConfiguredValue(
              sensor.alarm_high,
              sensor.unit,
              copy.notConfigured,
            )}
          />

          <MetadataItem
            label={copy.maxValue}
            value={formatConfiguredValue(
              sensor.max_value,
              sensor.unit,
              copy.notConfigured,
            )}
          />
        </Box>
      </Stack>
    </Box>
  );
}

function formatConfiguredValue(
  value: number | null | undefined,
  unit: string,
  notConfiguredLabel: string,
) {
  if (value === null || value === undefined) {
    return notConfiguredLabel;
  }

  return unit ? `${value} ${unit}` : String(value);
}

interface MetadataItemProps {
  label: string;
  value: string;
}

function MetadataItem({ label, value }: MetadataItemProps) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>

      <Typography variant="body2">{value}</Typography>
    </Box>
  );
}

interface ConfigurationStateChipProps {
  value: number | undefined;
  activeLabel: string;
  inactiveLabel: string;
}

function ConfigurationStateChip({
  value,
  activeLabel,
  inactiveLabel,
}: ConfigurationStateChipProps) {
  if (value === undefined) {
    return null;
  }

  return (
    <Chip
      size="small"
      label={value === 1 ? activeLabel : inactiveLabel}
      variant={value === 1 ? "filled" : "outlined"}
    />
  );
}
