import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useLocalization } from "../localization/useLocalization";
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

        <Alert severity="error">{copy.error}</Alert>
      </Stack>
    );
  }

  const sites = sitesQuery.data ?? [];
  const rooms = roomsQuery.data ?? [];
  const sensors = sensorsQuery.data ?? [];

  if (sites.length === 0) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />

        <Alert severity="info">{copy.noSites}</Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={4}>
      <PageHeading title={copy.title} description={copy.description} />

      <Stack spacing={3}>
        {sites.map((site) => (
          <SiteSection
            key={site.id ?? site.code}
            site={site}
            rooms={rooms}
            sensors={sensors}
            copy={copy}
          />
        ))}
      </Stack>
    </Stack>
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
  copy: MonitoredAreasResources;
}

function SiteSection({ site, rooms, sensors, copy }: SiteSectionProps) {
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
  copy: MonitoredAreasResources;
}

function RoomSection({ room, sensors, copy }: RoomSectionProps) {
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
