import { useMemo, useState } from "react";
import { Link as RouterLink } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import type { DashboardRoomStatus } from "../dashboard/contracts";
import {
  deriveLiveBoardStatus,
  type LiveBoardStatus,
} from "../dashboard/liveBoardStatus";
import { useDashboardRoomStatuses } from "../dashboard/queries";
import { useLocalization } from "../localization/useLocalization";

export function LiveBoardPage() {
  const { resources } = useLocalization();
  const copy = resources.liveBoard;
  const query = useDashboardRoomStatuses();
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("ALL");
  const [status, setStatus] = useState<LiveBoardStatus | "ALL">("ALL");
  const [density, setDensity] = useState<"comfortable" | "compact">(
    "comfortable",
  );

  const rooms = useMemo(() => query.data ?? [], [query.data]);
  const sites = useMemo(
    () => [...new Set(rooms.map((room) => room.siteName))].sort(),
    [rooms],
  );
  const visibleRooms = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return rooms.filter((room) => {
      const roomStatus = deriveLiveBoardStatus(room);
      return (
        (site === "ALL" || room.siteName === site) &&
        (status === "ALL" || roomStatus === status) &&
        (!term ||
          room.roomName.toLocaleLowerCase().includes(term) ||
          room.siteName.toLocaleLowerCase().includes(term))
      );
    });
  }, [rooms, search, site, status]);

  const counts = rooms.reduce<Record<LiveBoardStatus, number>>(
    (result, room) => {
      result[deriveLiveBoardStatus(room)] += 1;
      return result;
    },
    { NORMAL: 0, WARNING: 0, ALARM: 0, OFFLINE: 0 },
  );
  const latestUpdate = rooms
    .map((room) => room.lastUpdate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  if (query.isPending) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />
        <Box
          role="status"
          sx={{ alignItems: "center", display: "flex", gap: 2 }}
        >
          <CircularProgress size={24} />
          <Typography>{copy.loading}</Typography>
        </Box>
      </Stack>
    );
  }

  if (query.isError) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />
        <Alert
          action={
            <Button
              color="inherit"
              onClick={() => void query.refetch()}
              size="small"
            >
              {copy.retry}
            </Button>
          }
          severity="error"
        >
          {copy.error}
        </Alert>
      </Stack>
    );
  }

  return (
    <Stack spacing={3}>
      <Box
        sx={{
          alignItems: { xs: "stretch", md: "flex-start" },
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          gap: 2,
          justifyContent: "space-between",
        }}
      >
        <PageHeading title={copy.title} description={copy.description} />
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ alignItems: { xs: "stretch", sm: "center" } }}
        >
          <Chip
            color="success"
            label={`${copy.live} · ${copy.autoRefresh}`}
            size="small"
            variant="outlined"
          />
          <Typography color="text.secondary" variant="caption">
            {copy.lastUpdate}: {latestUpdate ?? copy.unavailable}
          </Typography>
          <Button
            disabled={query.isFetching}
            onClick={() => void query.refetch()}
            variant="contained"
          >
            {query.isFetching ? copy.refreshing : copy.refresh}
          </Button>
        </Stack>
      </Box>

      <Box
        component="section"
        aria-label={copy.title}
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
        }}
      >
        {(["NORMAL", "WARNING", "ALARM", "OFFLINE"] as const).map((item) => (
          <SummaryTile
            key={item}
            status={item}
            value={counts[item]}
            label={statusLabel(item, copy)}
          />
        ))}
      </Box>

      <Paper variant="outlined" sx={{ bgcolor: "action.hover", p: 2.5 }}>
        <Box
          sx={{
            alignItems: "center",
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "2fr 1fr 1fr auto",
            },
          }}
        >
          <TextField
            label={copy.search}
            onChange={(event) => setSearch(event.target.value)}
            size="small"
            value={search}
          />
          <FormControl size="small">
            <InputLabel>{copy.siteFilter}</InputLabel>
            <Select
              label={copy.siteFilter}
              onChange={(event) => setSite(event.target.value)}
              value={site}
            >
              <MenuItem value="ALL">{copy.allSites}</MenuItem>
              {sites.map((siteName) => (
                <MenuItem key={siteName} value={siteName}>
                  {siteName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>{copy.statusFilter}</InputLabel>
            <Select
              label={copy.statusFilter}
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <MenuItem value="ALL">{copy.allStatuses}</MenuItem>
              {(["NORMAL", "WARNING", "ALARM", "OFFLINE"] as const).map(
                (item) => (
                  <MenuItem key={item} value={item}>
                    {statusLabel(item, copy)}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
          <ToggleButtonGroup
            exclusive
            onChange={(_, value: "comfortable" | "compact" | null) =>
              value && setDensity(value)
            }
            size="small"
            value={density}
            aria-label={copy.density}
          >
            <ToggleButton value="comfortable">{copy.comfortable}</ToggleButton>
            <ToggleButton value="compact">{copy.compact}</ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Paper>

      {rooms.length === 0 ? <Alert severity="info">{copy.empty}</Alert> : null}
      {rooms.length > 0 && visibleRooms.length === 0 ? (
        <Alert severity="info">{copy.noMatches}</Alert>
      ) : null}
      {visibleRooms.length > 0 ? (
        <Box
          sx={{
            display: "grid",
            gap: density === "compact" ? 2 : 3,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl:
                density === "compact"
                  ? "repeat(4, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {visibleRooms.map((room) => (
            <AreaCard
              key={room.roomId}
              room={room}
              compact={density === "compact"}
              copy={copy}
            />
          ))}
        </Box>
      ) : null}

      <Button
        component={RouterLink}
        sx={{ alignSelf: "flex-start" }}
        to="/monitored-areas"
        variant="outlined"
      >
        {copy.openDetails}
      </Button>
    </Stack>
  );
}

type LiveBoardCopy = ReturnType<
  typeof useLocalization
>["resources"]["liveBoard"];

function PageHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box>
      <Typography component="h1" variant="h4">
        {title}
      </Typography>
      <Typography color="text.secondary">{description}</Typography>
    </Box>
  );
}

function statusLabel(status: LiveBoardStatus, copy: LiveBoardCopy) {
  return status === "NORMAL"
    ? copy.normal
    : status === "WARNING"
      ? copy.warning
      : status === "ALARM"
        ? copy.alarm
        : copy.offline;
}

function statusTone(status: LiveBoardStatus) {
  return status === "NORMAL"
    ? "success.main"
    : status === "WARNING"
      ? "warning.main"
      : status === "ALARM"
        ? "error.main"
        : "text.secondary";
}

function SummaryTile({
  status,
  value,
  label,
}: {
  status: LiveBoardStatus;
  value: number;
  label: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        borderInlineStart: 5,
        borderInlineStartColor: statusTone(status),
        p: 2.5,
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography
        sx={{
          color: statusTone(status),
          fontVariantNumeric: "tabular-nums",
          fontWeight: 800,
        }}
        variant="h4"
      >
        {value}
      </Typography>
    </Paper>
  );
}

function AreaCard({
  room,
  compact,
  copy,
}: {
  room: DashboardRoomStatus;
  compact: boolean;
  copy: LiveBoardCopy;
}) {
  const status = deriveLiveBoardStatus(room);
  const chipColor =
    status === "NORMAL"
      ? "success"
      : status === "WARNING"
        ? "warning"
        : status === "ALARM"
          ? "error"
          : "default";
  return (
    <Paper
      component="article"
      variant="outlined"
      sx={{
        borderBlockStart: 5,
        borderBlockStartColor: statusTone(status),
        p: compact ? 2.5 : 3.5,
      }}
    >
      <Stack spacing={compact ? 1.5 : 2.5}>
        <Box
          sx={{
            alignItems: "flex-start",
            display: "flex",
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="h2" noWrap variant="h6">
              {room.roomName}
            </Typography>
            <Typography color="text.secondary" noWrap variant="caption">
              {room.siteName}
            </Typography>
          </Box>
          <Chip
            color={chipColor}
            label={statusLabel(status, copy)}
            size="small"
            variant={status === "OFFLINE" ? "outlined" : "filled"}
          />
        </Box>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <Reading
            label={copy.temperature}
            value={
              room.temperature === null
                ? copy.unavailable
                : `${room.temperature} °C`
            }
          />
          <Reading
            label={copy.humidity}
            value={
              room.humidity === null ? copy.unavailable : `${room.humidity} %`
            }
          />
        </Box>
        <Box
          sx={{
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            justifyContent: "space-between",
          }}
        >
          <Typography variant="caption">
            {copy.activeAlarms}: <strong>{room.activeAlarms}</strong>
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {copy.communication}: {room.online ? copy.live : copy.offline}
          </Typography>
        </Box>
        <Typography color="text.secondary" variant="caption">
          {copy.lastUpdate}: {room.lastUpdate ?? copy.unavailable}
        </Typography>
      </Stack>
    </Paper>
  );
}

function Reading({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography color="text.secondary" variant="caption">
        {label}
      </Typography>
      <Typography
        sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}
        variant="h5"
      >
        {value}
      </Typography>
    </Box>
  );
}
