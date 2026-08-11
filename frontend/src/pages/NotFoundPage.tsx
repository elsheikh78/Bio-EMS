import { Button, Container, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { useLocalization } from "../localization/useLocalization";

export function NotFoundPage() {
  const { resources } = useLocalization();

  return (
    <Container component="section" maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h1" variant="h4">
          {resources.notFound.title}
        </Typography>
        <Button component={Link} to="/" variant="contained">
          {resources.notFound.action}
        </Button>
      </Stack>
    </Container>
  );
}
