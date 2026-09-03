import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { hasPermission, type Permission } from "../authorization/permissions";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";

interface WorkspaceAction {
  description: string;
  label: string;
  path: string;
  permission: Permission;
}

const englishActions: readonly WorkspaceAction[] = [
  {
    label: "Open dashboard",
    description:
      "Review the current operational overview and latest recorded evidence.",
    path: "/dashboard",
    permission: "DASHBOARD_READ",
  },
  {
    label: "Review monitored areas",
    description: "Inspect the configured Site, area, and Sensor hierarchy.",
    path: "/monitored-areas",
    permission: "CONFIGURATION_READ",
  },
  {
    label: "Review calibration",
    description: "Inspect Sensor calibration state and recorded history.",
    path: "/sensors-calibration",
    permission: "CONFIGURATION_READ",
  },
  {
    label: "Build calibration report",
    description:
      "Preview and export the currently available controlled report family.",
    path: "/reports",
    permission: "REPORT_READ",
  },
  {
    label: "Manage configuration",
    description:
      "Manage thresholds, delays, recipients, and escalation policies.",
    path: "/configuration",
    permission: "CONFIGURATION_WRITE",
  },
  {
    label: "Manage users and Audit",
    description: "Manage customer users and review Site-scoped Audit evidence.",
    path: "/users",
    permission: "USER_MANAGE",
  },
];

const arabicActions: readonly WorkspaceAction[] = [
  {
    label: "فتح لوحة المتابعة",
    description: "راجع النظرة التشغيلية الحالية وأحدث الأدلة المسجلة.",
    path: "/dashboard",
    permission: "DASHBOARD_READ",
  },
  {
    label: "مراجعة المناطق المراقبة",
    description: "افحص هيكل المواقع والمناطق والحساسات المُعد.",
    path: "/monitored-areas",
    permission: "CONFIGURATION_READ",
  },
  {
    label: "مراجعة المعايرة",
    description: "افحص حالة معايرة الحساسات والسجل المسجل.",
    path: "/sensors-calibration",
    permission: "CONFIGURATION_READ",
  },
  {
    label: "إنشاء تقرير معايرة",
    description: "عاين وصدّر مجموعة التقارير المنضبطة المتاحة حاليًا.",
    path: "/reports",
    permission: "REPORT_READ",
  },
  {
    label: "إدارة الإعدادات",
    description: "أدر الحدود والتأخيرات والمستلمين وسياسات التصعيد.",
    path: "/configuration",
    permission: "CONFIGURATION_WRITE",
  },
  {
    label: "إدارة المستخدمين والتدقيق",
    description: "أدر مستخدمي العميل وراجع أدلة التدقيق الخاصة بالموقع.",
    path: "/users",
    permission: "USER_MANAGE",
  },
];

const readiness = [
  ["Dashboard", "Available"],
  ["Monitored Areas", "Available / live telemetry validation pending"],
  ["Alarms", "Available / acknowledgement retest pending"],
  ["Devices", "Available"],
  ["Reports", "Calibration available / expansion scheduled"],
] as const;

const arabicReadiness = [
  ["لوحة المتابعة", "متاحة"],
  ["المناطق المراقبة", "متاحة / التحقق الحي للقراءات معلق"],
  ["الإنذارات", "متاحة / إعادة اختبار الإقرار معلقة"],
  ["الأجهزة", "متاحة"],
  ["التقارير", "المعايرة متاحة / التوسعة مجدولة"],
] as const;

export function ShellLandingPage() {
  const { language, resources } = useLocalization();
  const ar = language === "ar";
  const operationalActions = ar ? arabicActions : englishActions;
  const displayedReadiness = ar ? arabicReadiness : readiness;
  const { user } = useAuthentication();
  const actions = user
    ? operationalActions.filter((action) =>
        hasPermission(user.role, action.permission),
      )
    : [];

  return (
    <Stack spacing={5}>
      <Box>
        <Typography variant="overline" color="primary.main">
          {ar
            ? "نقطة دخول تشغيلية مصرح بها"
            : "Authorized operational entry point"}
        </Typography>
        <Typography component="h1" variant="h3">
          {resources.workspace.title}
        </Typography>
        <Typography color="text.secondary" sx={{ maxWidth: 760 }}>
          {ar
            ? "استخدم إجراءات العمل المنضبطة المتاحة أدناه. تظل الإمكانات المرحلية محددة بوضوح ولا تُعرض كجاهزة للإنتاج."
            : "Use the available controlled workflows below. Staged capabilities remain explicitly labelled and are not presented as production-ready."}
        </Typography>
      </Box>
      <Alert severity="info">
        {ar ? "الدور المسجل: " : "Signed-in role: "}
        <strong>{user?.role ?? (ar ? "غير متاح" : "Unavailable")}</strong>.{" "}
        {ar
          ? "تُرشح الإجراءات وفق صلاحيات الواجهة نفسها المستخدمة في المسارات المحمية، وتظل صلاحيات الخادم هي المرجع المعتمد."
          : "Actions are filtered through the same frontend permission vocabulary used by protected routing; backend authorization remains authoritative."}
      </Alert>
      <Box
        component="section"
        aria-label={
          ar ? "الإجراءات التشغيلية المتاحة" : "Available operational actions"
        }
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
          gap: 3,
        }}
      >
        {actions.map((action) => (
          <Paper
            key={action.path}
            variant="outlined"
            sx={{ p: 3, borderRadius: 3 }}
          >
            <Stack spacing={2} sx={{ height: "100%" }}>
              <Box sx={{ flexGrow: 1 }}>
                <Typography component="h2" variant="h6">
                  {action.label}
                </Typography>
                <Typography color="text.secondary">
                  {action.description}
                </Typography>
              </Box>
              <Button
                component={RouterLink}
                to={action.path}
                sx={{ alignSelf: "flex-start" }}
              >
                {ar ? "متابعة ←" : "Continue →"}
              </Button>
            </Stack>
          </Paper>
        ))}
      </Box>
      <Paper
        component="section"
        variant="outlined"
        sx={{ p: 3, borderRadius: 3 }}
      >
        <Typography component="h2" variant="h5" sx={{ mb: 2 }}>
          {ar ? "حالة اكتمال المنصة" : "Platform completion status"}
        </Typography>
        <Stack spacing={1.5}>
          {displayedReadiness.map(([feature, status]) => (
            <Box
              key={feature}
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: { xs: "flex-start", sm: "center" },
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                py: 1,
              }}
            >
              <Typography sx={{ fontWeight: 600 }}>{feature}</Typography>
              <Chip
                size="small"
                variant="outlined"
                color={
                  status === "Available" || status === "متاحة"
                    ? "success"
                    : "default"
                }
                label={status}
              />
            </Box>
          ))}
        </Stack>
      </Paper>
    </Stack>
  );
}
