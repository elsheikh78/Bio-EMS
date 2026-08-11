import { Box, Container, Paper, Stack, Typography } from "@mui/material";
import { useLocalization } from "../localization/useLocalization";

export function FoundationPage() {
  const { resources } = useLocalization();

  return (
    <Box component="main" sx={{ minHeight: "100vh", py: 8 }}>
      <Container maxWidth="md">
        <Paper elevation={1} sx={{ p: { xs: 3, sm: 5 } }}>
          <Stack spacing={2}>
            <Typography component="h1" variant="h3">
              {resources.foundation.title}
            </Typography>
            <Typography color="text.secondary">
              {resources.foundation.description}
            </Typography>
            <Typography variant="body2">
              Operational screens, authentication, and the application shell are
              intentionally deferred to later Sprint 14 stories.
            </Typography>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
