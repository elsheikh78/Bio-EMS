import {
  AppBar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Container,
  Toolbar,
  Typography,
} from "@mui/material";
import { Link } from "react-router-dom";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformAuthentication } from "../platform-auth/usePlatformAuthentication";

const copy = {
  en: {
    title: "System Owner Console",
    subtitle: "Platform operations",
    signedIn: "Signed in as",
    logout: "Sign out",
    foundation:
      "Manage the platform customer fleet, licenses, update eligibility and service obligations.",
    open: "Open",
    modules: [
      { key: "customers", label: "Customer fleet" },
      { key: "installations", label: "Installation configuration" },
      { key: "licenses", label: "Licenses & installations" },
      { key: "updates", label: "Update entitlements" },
      { key: "service", label: "Maintenance, calibration & support" },
    ],
  },
  ar: {
    title: "لوحة مالك النظام",
    subtitle: "عمليات إدارة المنصة",
    signedIn: "تم تسجيل الدخول باسم",
    logout: "تسجيل الخروج",
    foundation: "إدارة عملاء المنصة والتراخيص وأهلية التحديث والتزامات الخدمة.",
    open: "فتح",
    modules: [
      { key: "customers", label: "العملاء والمواقع" },
      { key: "installations", label: "تهيئة التركيبات" },
      { key: "licenses", label: "التراخيص والتركيبات" },
      { key: "updates", label: "استحقاقات التحديث" },
      { key: "service", label: "الصيانة والمعايرة والدعم" },
    ],
  },
} as const;

export function SystemOwnerConsolePage() {
  const { language } = useLocalization();
  const { principal, logout } = usePlatformAuthentication();
  const text = copy[language];

  return (
    <Box component="main" sx={{ minHeight: "100vh" }}>
      <AppBar position="static">
        <Toolbar>
          <Box sx={{ flexGrow: 1 }}>
            <Typography component="h1" variant="h6">
              {text.title}
            </Typography>
            <Typography variant="caption">{text.subtitle}</Typography>
          </Box>
          <Box
            sx={{
              alignItems: "flex-end",
              display: "flex",
              flexDirection: "column",
              mr: 2,
            }}
          >
            <Typography variant="caption">{text.signedIn}</Typography>
            <Typography variant="body2">{principal?.username}</Typography>
          </Box>
          <Button color="inherit" onClick={logout}>
            {text.logout}
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {text.foundation}
        </Typography>
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
          }}
        >
          {text.modules.map((module) => {
            const active = true;
            return (
              <Card key={module.key} variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6">
                    {module.label}
                  </Typography>
                </CardContent>
                {active ? (
                  <CardActions>
                    <Button component={Link} to={`/system-owner/${module.key}`}>
                      {text.open}
                    </Button>
                  </CardActions>
                ) : null}
              </Card>
            );
          })}
        </Box>
      </Container>
    </Box>
  );
}
