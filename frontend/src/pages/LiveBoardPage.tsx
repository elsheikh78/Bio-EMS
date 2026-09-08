import { useEffect, useMemo, useRef, useState } from "react";
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
  Switch,
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
  const { language, resources } = useLocalization();
  const copy = resources.liveBoard;
  const query = useDashboardRoomStatuses();
  const wallRef = useRef<HTMLDivElement>(null);
  const [search, setSearch] = useState("");
  const [site, setSite] = useState("ALL");
  const [status, setStatus] = useState<LiveBoardStatus | "ALL">("ALL");
  const [density, setDensity] = useState<"comfortable" | "compact">("compact");
  const [alarmFocus, setAlarmFocus] = useState(false);
  const [fullScreen, setFullScreen] = useState(false);

  useEffect(() => {
    const onFullScreenChange = () => setFullScreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFullScreenChange);
    return () => document.removeEventListener("fullscreenchange", onFullScreenChange);
  }, []);

  const rooms = useMemo(() => query.data ?? [], [query.data]);
  const sites = useMemo(
    () => [...new Set(rooms.map((room) => room.siteName))].sort(),
    [rooms],
  );
  const visibleRooms = useMemo(() => {
    const term = search.trim().toLocaleLowerCase();
    return rooms.filter((room) => {
      const roomStatus = deriveLiveBoardStatus(room);
      const focusMatch =
        !alarmFocus || roomStatus === "ALARM" || roomStatus === "WARNING";
      return (
        focusMatch &&
        (site === "ALL" || room.siteName === site) &&
        (status === "ALL" || roomStatus === status) &&
        (!term ||
          room.roomName.toLocaleLowerCase().includes(term) ||
          room.siteName.toLocaleLowerCase().includes(term))
      );
    });
  }, [alarmFocus, rooms, search, site, status]);

  const counts = rooms.reduce<Record<LiveBoardStatus, number>>(
    (result, room) => {
      result[deriveLiveBoardStatus(room)] += 1;
      return result;
    },
    { NORMAL: 0, WARNING: 0, ALARM: 0, OFFLINE: 0 },
  );
  const healthyPercent =
    rooms.length === 0 ? 0 : Math.round((counts.NORMAL / rooms.length) * 1000) / 10;
  const latestUpdate = rooms
    .map((room) => room.lastUpdate)
    .filter((value): value is string => Boolean(value))
    .sort()
    .at(-1);

  const toggleFullScreen = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    } else {
      await wallRef.current?.requestFullscreen();
    }
  };

  if (query.isPending) {
    return (
      <Stack spacing={3}>
        <PageHeading title={copy.title} description={copy.description} />
        <Box role="status" sx={{ alignItems: "center", display: "flex", gap: 2 }}>
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
            <Button color="inherit" onClick={() => void query.refetch()} size="small">
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
    <Box
      ref={wallRef}
      sx={{
        bgcolor: "background.default",
        minHeight: fullScreen ? "100vh" : "auto",
        overflow: "auto",
        p: fullScreen ? { xs: 3, md: 5 } : 0,
      }}
    >
      <Stack spacing={2.5}>
        <Box
          sx={{
            alignItems: { xs: "stretch", lg: "center" },
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            gap: 2,
            justifyContent: "space-between",
          }}
        >
          <PageHeading title={copy.title} description={copy.description} />
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ alignItems: { xs: "stretch", sm: "center" } }}
          >
            <Chip
              color="success"
              icon={
                <Box
                  aria-hidden
                  sx={{
                    animation: "bioems-live-pulse 1.4s ease-in-out infinite",
                    bgcolor: "success.main",
                    borderRadius: "50%",
                    height: 8,
                    width: 8,
                    "@keyframes bioems-live-pulse": {
                      "0%, 100%": { boxShadow: "0 0 0 0 rgba(84, 213, 154, .55)" },
                      "50%": { boxShadow: "0 0 0 7px rgba(84, 213, 154, 0)" },
                    },
                  }}
                />
              }
              label={`${copy.live} · ${copy.autoRefresh}`}
              size="small"
              variant="outlined"
            />
            <Typography color="text.secondary" variant="caption">
              {copy.lastUpdate}:{" "}
              <Timestamp
                language={language}
                unavailable={copy.unavailable}
                value={latestUpdate}
              />
            </Typography>
            <Button onClick={() => void toggleFullScreen()} variant="outlined">
              {fullScreen ? copy.exitFullScreen : copy.fullScreen}
            </Button>
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
              lg: "repeat(4, minmax(0, 1fr)) 1.6fr",
            },
          }}
        >
          {(["NORMAL", "WARNING", "ALARM", "OFFLINE"] as const).map((item) => (
            <SummaryTile
              key={item}
              status={item}
              value={counts[item]}
              total={rooms.length}
              label={statusLabel(item, copy)}
            />
          ))}
          <Paper
            variant="outlined"
            sx={{
              alignItems: "center",
              borderColor: "success.dark",
              display: "flex",
              gap: 2,
              justifyContent: "space-between",
              p: 2.5,
            }}
          >
            <Box>
              <Typography color="text.secondary" variant="caption">
                {copy.systemHealth}
              </Typography>
              <Typography
                sx={{ color: "success.main", fontWeight: 800 }}
                variant="h4"
              >
                {healthyPercent}%
              </Typography>
              <Typography color="text.secondary" variant="caption">
                {copy.healthy}
              </Typography>
            </Box>
            <Box
              aria-hidden
              sx={{
                border: 3,
                borderColor: "success.main",
                borderRadius: "50%",
                boxShadow: "0 0 24px rgba(84, 213, 154, .22)",
                height: 56,
                opacity: 0.85,
                width: 56,
              }}
            />
          </Paper>
        </Box>

        <Paper variant="outlined" sx={{ p: 2 }}>
          <Box
            sx={{
              alignItems: "center",
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "2fr 1fr 1fr auto auto",
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
            <Box sx={{ alignItems: "center", display: "flex", px: 1 }}>
              <Switch
                checked={alarmFocus}
                slotProps={{ input: { "aria-label": copy.alarmFocus } }}
                onChange={(event) => setAlarmFocus(event.target.checked)}
              />
              <Typography variant="body2">{copy.alarmFocus}</Typography>
            </Box>
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
                lg:
                  density === "compact"
                    ? "repeat(3, minmax(0, 1fr))"
                    : "repeat(2, minmax(0, 1fr))",
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
                language={language}
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
    </Box>
  );
}

type Localization = ReturnType<typeof useLocalization>;
type LiveBoardCopy = Localization["resources"]["liveBoard"];
type LiveBoardLanguage = Localization["language"];

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

function statusGlow(status: LiveBoardStatus) {
  return status === "NORMAL"
    ? "rgba(84, 213, 154, .16)"
    : status === "WARNING"
      ? "rgba(255, 193, 92, .16)"
      : status === "ALARM"
        ? "rgba(255, 115, 107, .18)"
        : "rgba(168, 187, 192, .1)";
}

function SummaryTile({
  status,
  value,
  total,
  label,
}: {
  status: LiveBoardStatus;
  value: number;
  total: number;
  label: string;
}) {
  const percentage = total === 0 ? 0 : Math.round((value / total) * 1000) / 10;
  return (
    <Paper
      variant="outlined"
      sx={{
        borderColor: statusTone(status),
        boxShadow: `inset 0 0 24px ${statusGlow(status)}`,
        p: 2.5,
      }}
    >
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Box sx={{ alignItems: "baseline", display: "flex", gap: 1.5 }}>
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
        <Typography color="text.secondary" variant="caption">
          {percentage}%
        </Typography>
      </Box>
    </Paper>
  );
}

function AreaCard({
  room,
  compact,
  copy,
  language,
}: {
  room: DashboardRoomStatus;
  compact: boolean;
  copy: LiveBoardCopy;
  language: LiveBoardLanguage;
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
        borderColor: statusTone(status),
        boxShadow: `inset 0 0 30px ${statusGlow(status)}`,
        minHeight: compact ? 230 : 270,
        overflow: "hidden",
        p: compact ? 2.5 : 3.5,
        position: "relative",
        "&::after": {
          background: statusTone(status),
          content: '""',
          height: 3,
          insetInline: 0,
          position: "absolute",
          top: 0,
        },
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

        <Box>
          <Typography color="text.secondary" variant="caption">
            {copy.currentReading}
          </Typography>
          <Typography
            sx={{
              color: statusTone(status),
              fontSize: compact ? "2.2rem" : "2.7rem",
              fontVariantNumeric: "tabular-nums",
              fontWeight: 800,
              letterSpacing: "-0.04em",
              lineHeight: 1.1,
            }}
          >
            {room.temperature === null ? copy.unavailable : `${room.temperature} °C`}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          }}
        >
          <Reading
            label={copy.humidity}
            value={room.humidity === null ? copy.unavailable : `${room.humidity} %`}
          />
          <Reading label={copy.activeAlarms} value={String(room.activeAlarms)} />
        </Box>

        <Box
          sx={{
            borderBlockStart: 1,
            borderColor: "divider",
            display: "flex",
            flexWrap: "wrap",
            gap: 1.5,
            justifyContent: "space-between",
            pt: 1.5,
          }}
        >
          <Typography
            sx={{ color: room.online ? "success.main" : "text.secondary" }}
            variant="caption"
          >
            ● {copy.communication}: {room.online ? copy.live : copy.offline}
          </Typography>
          <Typography color="text.secondary" variant="caption">
            {copy.lastUpdate}:{" "}
            <Timestamp
              language={language}
              unavailable={copy.unavailable}
              value={room.lastUpdate ?? undefined}
            />
          </Typography>
        </Box>
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
      <Typography sx={{ fontVariantNumeric: "tabular-nums", fontWeight: 800 }}>
        {value}
      </Typography>
    </Box>
  );
}

function Timestamp({
  language,
  unavailable,
  value,
}: {
  language: LiveBoardLanguage;
  unavailable: string;
  value?: string;
}) {
  let display = unavailable;
  if (value) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      display = new Intl.DateTimeFormat(language === "ar" ? "ar-EG" : "en-GB", {
        dateStyle: "medium",
        timeStyle: "medium",
      }).format(date);
    }
  }

  return (
    <Box component="bdi" dir="ltr" sx={{ display: "inline", unicodeBidi: "isolate" }}>
      {display}
    </Box>
  );
}
