import { Alert, Box, Button, Stack, Typography } from "@mui/material";
import { useInitialFocus } from "../accessibility/useInitialFocus";
import { useAuthentication } from "../auth/useAuthentication";
import { useLocalization } from "../localization/useLocalization";

export function RestorationErrorPage() {
  const { logout, retryRestoration } = useAuthentication();
  const { resources } = useLocalization();
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  return (
    <Box
      component="main"
      sx={{ display: "grid", minHeight: "100vh", placeItems: "center", p: 2 }}
    >
      <Alert severity="warning" sx={{ maxWidth: 560 }}>
        <Typography
          component="h1"
          gutterBottom
          ref={headingRef}
          tabIndex={-1}
          variant="h5"
        >
          {resources.authentication.restorationTitle}
        </Typography>
        <Typography>
          {resources.authentication.restorationDescription}
        </Typography>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          sx={{ mt: 2 }}
        >
          <Button onClick={() => void retryRestoration()} variant="contained">
            {resources.authentication.retry}
          </Button>
          <Button onClick={() => void logout()} variant="outlined">
            {resources.authentication.logout}
          </Button>
        </Stack>
      </Alert>
    </Box>
  );
}
