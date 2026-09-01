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
      "Owner console foundation is active. Commercial operation modules are added through the controlled P7 work packages.",
    open: "Open",
    planned: "Planned in a later P7 package",
    modules: [
      { key: "customers", label: "Customer fleet" },
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
    foundation:
      "تم تفعيل الأساس الآمن للوحة مالك النظام. تتم إضافة وحدات العمليات التجارية من خلال حزم P7 المعتمدة.",
    open: "فتح",
    planned: "مخطط لها في حزمة P7 لاحقة",
    modules: [
      { key: "customers", label: "العملاء والمواقع" },
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
            const active = module.key === "customers";
            return (
              <Card key={module.key} variant="outlined">
                <CardContent>
                  <Typography component="h2" variant="h6">
                    {module.label}
                  </Typography>
                  {!active ? (
                    <Typography color="text.secondary" variant="body2">
                      {text.planned}
                    </Typography>
                  ) : null}
                </CardContent>
                {active ? (
                  <CardActions>
                    <Button component={Link} to="/system-owner/customers">
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
