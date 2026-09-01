import { AppBar, Box, Button, Card, CardContent, Container, Stack, Toolbar, Typography } from "@mui/material";
import { useLocalization } from "../localization/useLocalization";
import { usePlatformAuthentication } from "../platform-auth/PlatformAuthenticationProvider";

const copy = {
  en: {
    title: "System Owner Console",
    subtitle: "Platform operations",
    signedIn: "Signed in as",
    logout: "Sign out",
    foundation: "Owner console foundation is active. Commercial operation modules are added through the controlled P7 work packages.",
    modules: ["Customer fleet", "Licenses & installations", "Update entitlements", "Maintenance, calibration & support"],
  },
  ar: {
    title: "لوحة مالك النظام",
    subtitle: "عمليات إدارة المنصة",
    signedIn: "تم تسجيل الدخول باسم",
    logout: "تسجيل الخروج",
    foundation: "تم تفعيل الأساس الآمن للوحة مالك النظام. تتم إضافة وحدات العمليات التجارية من خلال حزم P7 المعتمدة.",
    modules: ["العملاء والمواقع", "التراخيص والتركيبات", "استحقاقات التحديث", "الصيانة والمعايرة والدعم"],
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
            <Typography component="h1" variant="h6">{text.title}</Typography>
            <Typography variant="caption">{text.subtitle}</Typography>
          </Box>
          <Stack alignItems="flex-end" sx={{ mr: 2 }}>
            <Typography variant="caption">{text.signedIn}</Typography>
            <Typography variant="body2">{principal?.username}</Typography>
          </Stack>
          <Button color="inherit" onClick={logout}>{text.logout}</Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography color="text.secondary" sx={{ mb: 3 }}>{text.foundation}</Typography>
        <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" } }}>
          {text.modules.map((module) => (
            <Card key={module} variant="outlined">
              <CardContent>
                <Typography component="h2" variant="h6">{module}</Typography>
              </CardContent>
            </Card>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
