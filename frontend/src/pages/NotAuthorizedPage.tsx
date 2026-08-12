import { Alert, Stack, Typography } from "@mui/material";
import { useInitialFocus } from "../accessibility/useInitialFocus";
import { useLocalization } from "../localization/useLocalization";

export function NotAuthorizedPage() {
  const { resources } = useLocalization();
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  return (
    <Stack component="section" spacing={2}>
      <Typography component="h1" ref={headingRef} tabIndex={-1} variant="h3">
        {resources.notAuthorized.title}
      </Typography>
      <Alert severity="warning">{resources.notAuthorized.description}</Alert>
    </Stack>
  );
}
