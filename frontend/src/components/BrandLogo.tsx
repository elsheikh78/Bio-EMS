import { Box, type SxProps, type Theme } from "@mui/material";
import horizontalLogo from "../assets/bio-ems-logo-horizontal.png";
import compactMark from "../assets/bio-ems-mark.png";

interface BrandLogoProps {
  compact?: boolean;
  decorative?: boolean;
  sx?: SxProps<Theme>;
}

export function BrandLogo({
  compact = false,
  decorative = false,
  sx,
}: BrandLogoProps) {
  return (
    <Box
      alt={decorative ? "" : "BIO-EMS"}
      aria-hidden={decorative || undefined}
      component="img"
      draggable={false}
      src={compact ? compactMark : horizontalLogo}
      sx={{
        display: "block",
        maxWidth: "100%",
        objectFit: "contain",
        userSelect: "none",
        ...sx,
      }}
    />
  );
}
