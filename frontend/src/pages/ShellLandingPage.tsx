import { Paper, Stack, Typography } from "@mui/material";
import { useLocalization } from "../localization/useLocalization";

export function ShellLandingPage() {
  const { resources } = useLocalization();

  return (
    <Paper
      component="section"
      elevation={1}
      sx={{ maxWidth: 880, p: { xs: 3, sm: 5 } }}
    >
      <Stack spacing={2}>
        <Typography component="h1" variant="h3">
          {resources.workspace.title}
        </Typography>
        <Typography color="text.secondary">
          {resources.workspace.description}
        </Typography>
      </Stack>
    </Paper>
  );
}
