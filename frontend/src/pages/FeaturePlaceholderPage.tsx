import { Alert, Stack, Typography } from "@mui/material";
import type { TranslationResources } from "../localization/resources";
import { useLocalization } from "../localization/useLocalization";

export type PlaceholderKey = keyof TranslationResources["placeholders"];

interface FeaturePlaceholderPageProps {
  feature: PlaceholderKey;
}

export function FeaturePlaceholderPage({
  feature,
}: FeaturePlaceholderPageProps) {
  const { resources } = useLocalization();
  const copy = resources.placeholders[feature];

  return (
    <Stack component="section" spacing={2}>
      <Typography component="h1" variant="h3">
        {copy.title}
      </Typography>
      <Alert severity="info">{copy.description}</Alert>
    </Stack>
  );
}
