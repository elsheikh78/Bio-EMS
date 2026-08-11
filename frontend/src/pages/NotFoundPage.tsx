import { Button, Container, Stack, Typography } from "@mui/material";
import { Link } from "react-router-dom";
import { englishResources } from "../localization/resources";

export function NotFoundPage() {
  return (
    <Container component="main" maxWidth="sm" sx={{ py: 8 }}>
      <Stack spacing={2} sx={{ alignItems: "flex-start" }}>
        <Typography component="h1" variant="h4">
          {englishResources.notFound.title}
        </Typography>
        <Button component={Link} to="/" variant="contained">
          {englishResources.notFound.action}
        </Button>
      </Stack>
    </Container>
  );
}
