import { Alert, Box, Paper, Stack, Typography, useTheme } from "@mui/material";
import type { DashboardAlarmStatistics, DashboardSummary } from "./contracts";

interface DistributionItem {
  label: string;
  value: number;
  color: string;
}

interface DistributionPanelProps {
  title: string;
  description: string;
  items: DistributionItem[];
  totalLabel: string;
  emptyLabel: string;
}

function DistributionPanel({
  title,
  description,
  items,
  totalLabel,
  emptyLabel,
}: DistributionPanelProps) {
  const theme = useTheme();
  const total = items.reduce((sum, item) => sum + item.value, 0);
  const segments = items
    .filter((item) => item.value > 0 && total > 0)
    .map((item, index, visibleItems) => {
      const start = visibleItems
        .slice(0, index)
        .reduce((sum, previous) => sum + (previous.value / total) * 100, 0);
      const end = start + (item.value / total) * 100;
      const color =
        item.color === "success.main"
          ? theme.palette.success.main
          : item.color === "error.main"
            ? theme.palette.error.main
            : item.color === "warning.main"
              ? theme.palette.warning.main
              : theme.palette.info.main;
      return `${color} ${start}% ${end}%`;
    });
  const chartBackground =
    segments.length > 0
      ? `conic-gradient(${segments.join(", ")})`
      : theme.palette.action.hover;

  return (
    <Paper
      variant="outlined"
      sx={{
        borderRadius: 3.5,
        overflow: "hidden",
        boxShadow: "0 8px 24px rgba(7, 59, 76, 0.06)",
      }}
    >
      <Stack spacing={2.5} sx={{ p: 3 }}>
        <Box>
          <Typography component="h3" variant="h6">
            {title}
          </Typography>
          <Typography color="text.secondary" variant="body2">
            {description}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "144px 1fr" },
            alignItems: "center",
            gap: 5,
          }}
        >
          <Box
            aria-hidden="true"
            sx={{
              position: "relative",
              width: 136,
              height: 136,
              mx: "auto",
              borderRadius: "50%",
              background: chartBackground,
              "&::after": {
                content: '""',
                position: "absolute",
                inset: 18,
                borderRadius: "50%",
                bgcolor: "background.paper",
              },
            }}
          >
            <Stack
              sx={{
                position: "absolute",
                inset: 0,
                zIndex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
              spacing={0}
            >
              <Typography
                variant="h5"
                sx={{ fontVariantNumeric: "tabular-nums" }}
              >
                {total}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {totalLabel}
              </Typography>
            </Stack>
          </Box>
          <Box component="dl" sx={{ display: "grid", gap: 2.5, m: 0 }}>
            {items.map((item) => (
              <Box
                key={item.label}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto 1fr auto",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Box
                  aria-hidden="true"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: item.color,
                  }}
                />
                <Typography
                  component="dt"
                  variant="body2"
                  color="text.secondary"
                >
                  {item.label}
                </Typography>
                <Typography
                  component="dd"
                  variant="subtitle2"
                  sx={{ m: 0, fontVariantNumeric: "tabular-nums" }}
                >
                  {item.value}
                </Typography>
              </Box>
            ))}
            {total === 0 ? (
              <Typography color="text.secondary">{emptyLabel}</Typography>
            ) : null}
          </Box>
        </Box>
      </Stack>
    </Paper>
  );
}

interface OperationalOverviewProps {
  summary?: DashboardSummary;
  alarmStatistics?: DashboardAlarmStatistics;
  labels: {
    title: string;
    description: string;
    deviceTitle: string;
    deviceDescription: string;
    online: string;
    offline: string;
    staleUnavailable: string;
    severityTitle: string;
    severityDescription: string;
    critical: string;
    warning: string;
    info: string;
    total: string;
    noData: string;
    trendUnavailable: string;
    partialData: string;
    panelUnavailable: string;
  };
}

export function OperationalOverview({
  summary,
  alarmStatistics,
  labels,
}: OperationalOverviewProps) {
  const onlineDevices = summary
    ? Math.max(summary.totalDevices - summary.offlineDevices, 0)
    : 0;

  return (
    <Box component="section" aria-labelledby="operational-overview-title">
      <Stack spacing={2}>
        <Box>
          <Typography
            component="h2"
            variant="h5"
            id="operational-overview-title"
          >
            {labels.title}
          </Typography>
          <Typography color="text.secondary">{labels.description}</Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
          }}
        >
          {summary ? (
            <DistributionPanel
              title={labels.deviceTitle}
              description={labels.deviceDescription}
              items={[
                {
                  label: labels.online,
                  value: onlineDevices,
                  color: "success.main",
                },
                {
                  label: labels.offline,
                  value: summary.offlineDevices,
                  color: "error.main",
                },
              ]}
              totalLabel={labels.total}
              emptyLabel={labels.noData}
            />
          ) : (
            <UnavailablePanel
              title={labels.deviceTitle}
              description={labels.panelUnavailable}
            />
          )}

          {alarmStatistics ? (
            <DistributionPanel
              title={labels.severityTitle}
              description={labels.severityDescription}
              items={[
                {
                  label: labels.critical,
                  value: alarmStatistics.critical,
                  color: "error.main",
                },
                {
                  label: labels.warning,
                  value: alarmStatistics.warning,
                  color: "warning.main",
                },
                {
                  label: labels.info,
                  value: alarmStatistics.info,
                  color: "info.main",
                },
              ]}
              totalLabel={labels.total}
              emptyLabel={labels.noData}
            />
          ) : (
            <UnavailablePanel
              title={labels.severityTitle}
              description={labels.panelUnavailable}
            />
          )}
        </Box>

        {!summary || !alarmStatistics ? (
          <Alert severity="warning">{labels.partialData}</Alert>
        ) : null}

        <Paper
          variant="outlined"
          sx={{ p: 2, borderRadius: 2, bgcolor: "action.hover" }}
        >
          <Typography variant="body2" color="text.secondary">
            {labels.staleUnavailable} {labels.trendUnavailable}
          </Typography>
        </Paper>
      </Stack>
    </Box>
  );
}

function UnavailablePanel({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
      <Stack spacing={1}>
        <Typography component="h3" variant="h6">
          {title}
        </Typography>
        <Typography color="text.secondary">{description}</Typography>
      </Stack>
    </Paper>
  );
}
