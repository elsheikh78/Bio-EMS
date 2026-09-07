import { Alert, Button, Paper, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useInitialFocus } from "../accessibility/useInitialFocus";
import { useLocalization } from "../localization/useLocalization";

export function NotAuthorizedPage() {
  const { resources } = useLocalization();
  const headingRef = useInitialFocus<HTMLHeadingElement>();

  return (
    <Paper
      component="section"
      variant="outlined"
      sx={{ mx: "auto", p: { xs: 3, sm: 5 }, width: "min(100%, 640px)" }}
    >
      <Stack spacing={3} sx={{ alignItems: "flex-start" }}>
        <Typography component="h1" ref={headingRef} tabIndex={-1} variant="h3">
          {resources.notAuthorized.title}
        </Typography>
        <Alert severity="warning">{resources.notAuthorized.description}</Alert>
        <Button component={Link} to="/" variant="contained">
          {resources.notFound.action}
        </Button>
      </Stack>
    </Paper>
  );
}
