import { Box, Paper, Stack, Typography } from "@mui/material";
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
  const total = items.reduce((sum, item) => sum + item.value, 0);

  return (
    <Paper variant="outlined" sx={{ borderRadius: 3, overflow: "hidden" }}>
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
          aria-hidden="true"
          sx={{
            display: "flex",
            minHeight: 14,
            overflow: "hidden",
            borderRadius: 999,
            bgcolor: "action.hover",
          }}
        >
          {total > 0
            ? items.map((item) => (
                <Box
                  key={item.label}
                  sx={{
                    width: `${(item.value / total) * 100}%`,
                    minWidth: item.value > 0 ? 6 : 0,
                    bgcolor: item.color,
                    transition: "width 180ms ease-out",
                  }}
                />
              ))
            : null}
        </Box>

        {total === 0 ? (
          <Typography color="text.secondary">{emptyLabel}</Typography>
        ) : null}

        <Box
          component="dl"
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 1.5,
            m: 0,
          }}
        >
          {items.map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "grid",
                gridTemplateColumns: "auto 1fr auto",
                alignItems: "center",
                gap: 1,
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
              <Typography component="dt" variant="body2" color="text.secondary">
                {item.label}
              </Typography>
              <Typography component="dd" variant="subtitle2" sx={{ m: 0 }}>
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>

        <Typography variant="caption" color="text.secondary">
          {totalLabel}: {total}
        </Typography>
      </Stack>
    </Paper>
  );
}

interface OperationalOverviewProps {
  summary: DashboardSummary;
  alarmStatistics: DashboardAlarmStatistics;
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
  };
}

export function OperationalOverview({
  summary,
  alarmStatistics,
  labels,
}: OperationalOverviewProps) {
  const onlineDevices = Math.max(
    summary.totalDevices - summary.offlineDevices,
    0,
  );

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
        </Box>

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
