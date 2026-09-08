import { Box, LinearProgress, Typography } from "@mui/material";
import { useEffect, useState, type PropsWithChildren } from "react";
import { useLocalization } from "../localization/useLocalization";
import { BrandLogo } from "./BrandLogo";

export const OPENING_SEEN_KEY = "bioems.opening.seen";

interface OpeningExperienceProps extends PropsWithChildren {
  duration?: number;
  enabled?: boolean;
}

function wasSeen() {
  try {
    return sessionStorage.getItem(OPENING_SEEN_KEY) === "1";
  } catch {
    return false;
  }
}

export function OpeningExperience({
  children,
  duration = 5_000,
  enabled = true,
}: OpeningExperienceProps) {
  const [visible, setVisible] = useState(() => enabled && !wasSeen());

  useEffect(() => {
    if (!visible) return;
    const timer = window.setTimeout(() => {
      try {
        sessionStorage.setItem(OPENING_SEEN_KEY, "1");
      } catch {
        // Startup must continue when browser storage is blocked.
      }
      setVisible(false);
    }, duration);
    return () => window.clearTimeout(timer);
  }, [duration, visible]);

  return visible ? <OpeningScreen /> : children;
}

function OpeningScreen() {
  const { resources } = useLocalization();

  return (
    <Box
      aria-label={resources.opening.title}
      role="status"
      sx={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 38%, rgba(19, 138, 170, 0.32), transparent 35%), linear-gradient(155deg, #031724 0%, #062E42 52%, #041D2A 100%)",
        color: "#F1FAFB",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
        px: 5,
        "&::before": {
          backgroundImage:
            "radial-gradient(circle, rgba(89, 215, 222, 0.46) 0 2px, transparent 3px)",
          backgroundSize: "96px 72px",
          content: '""',
          inset: 0,
          maskImage: "linear-gradient(to bottom, black, transparent 68%)",
          opacity: 0.42,
          position: "absolute",
        },
        "&::after": {
          background:
            "linear-gradient(90deg, transparent, rgba(44, 208, 205, 0.7), rgba(31, 132, 211, 0.8), transparent)",
          bottom: "14%",
          boxShadow: "0 0 34px rgba(37, 199, 193, 0.45)",
          content: '""',
          height: 2,
          insetInline: "-10%",
          position: "absolute",
          transform: "skewY(-2deg)",
        },
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          maxWidth: 680,
          position: "relative",
          textAlign: "center",
          width: "100%",
          zIndex: 1,
        }}
      >
        <BrandLogo
          sx={{
            filter: "drop-shadow(0 12px 30px rgba(0, 0, 0, 0.34))",
            height: { xs: 118, sm: 176 },
            width: { xs: 300, sm: 520 },
          }}
        />
        <Typography
          component="h1"
          sx={{
            fontSize: { xs: "1rem", sm: "1.3rem" },
            fontWeight: 600,
            letterSpacing: { xs: 1.4, sm: 3 },
            mt: 1,
          }}
        >
          {resources.opening.subtitle}
        </Typography>
        <LinearProgress
          aria-label={resources.opening.loading}
          sx={{
            bgcolor: "rgba(255,255,255,0.12)",
            borderRadius: 10,
            height: 4,
            mt: 9,
            overflow: "hidden",
            width: { xs: "78%", sm: 360 },
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #18A6A6, #54D59A)",
            },
          }}
        />
        <Typography sx={{ color: "#A8CDD4", mt: 3 }} variant="body2">
          {resources.opening.loading}
        </Typography>
      </Box>
    </Box>
  );
}
