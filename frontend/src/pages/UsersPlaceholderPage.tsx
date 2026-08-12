import { Alert, Stack, Typography } from "@mui/material";
import { useLocalization } from "../localization/useLocalization";

export function UsersPlaceholderPage() {
  const { resources } = useLocalization();

  return (
    <Stack component="section" spacing={2}>
      <Typography component="h1" variant="h3">
        {resources.placeholders.users.title}
      </Typography>
      <Alert severity="info">{resources.placeholders.users.description}</Alert>
    </Stack>
  );
}
