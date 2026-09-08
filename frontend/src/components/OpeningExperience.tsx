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

const ambientSensors = [
  { label: "°C", insetInlineStart: "10%", top: "27%", delay: "0s" },
  { label: "H₂O", insetInlineStart: "20%", top: "68%", delay: ".6s" },
  { label: "CO₂", insetInlineEnd: "12%", top: "31%", delay: "1.1s" },
  { label: "⌁", insetInlineEnd: "22%", top: "70%", delay: "1.7s" },
] as const;

function OpeningScreen() {
  const { resources } = useLocalization();

  return (
    <Box
      aria-label={resources.opening.title}
      role="status"
      sx={{
        alignItems: "center",
        background:
          "radial-gradient(circle at 50% 38%, rgba(19, 138, 170, 0.34), transparent 34%), radial-gradient(circle at 88% 16%, rgba(24, 166, 166, 0.16), transparent 24%), linear-gradient(155deg, #020D18 0%, #062E42 52%, #031520 100%)",
        color: "#F1FAFB",
        display: "flex",
        isolation: "isolate",
        justifyContent: "center",
        minHeight: "100vh",
        overflow: "hidden",
        position: "relative",
        px: 5,
        "@keyframes bioems-opening-float": {
          "0%, 100%": { opacity: 0.55, transform: "translateY(0) scale(1)" },
          "50%": { opacity: 1, transform: "translateY(-8px) scale(1.04)" },
        },
        "@keyframes bioems-opening-wave": {
          "0%": { opacity: 0.38, transform: "translateX(-2%)" },
          "50%": { opacity: 0.9, transform: "translateX(2%)" },
          "100%": { opacity: 0.38, transform: "translateX(-2%)" },
        },
        "@media (prefers-reduced-motion: reduce)": {
          "& *": { animation: "none !important" },
        },
        "&::before": {
          backgroundImage:
            "linear-gradient(rgba(72, 185, 213, .055) 1px, transparent 1px), linear-gradient(90deg, rgba(72, 185, 213, .055) 1px, transparent 1px), radial-gradient(circle, rgba(89, 215, 222, .52) 0 1.5px, transparent 2.5px)",
          backgroundSize: "64px 64px, 64px 64px, 112px 84px",
          content: '""',
          inset: 0,
          maskImage:
            "linear-gradient(to bottom, rgba(0,0,0,.95), rgba(0,0,0,.15) 82%, transparent)",
          opacity: 0.46,
          position: "absolute",
          zIndex: -2,
        },
        "&::after": {
          background:
            "radial-gradient(ellipse at center, rgba(37, 199, 193, .2), transparent 65%)",
          bottom: "-18%",
          content: '""',
          height: "52%",
          insetInline: "-12%",
          position: "absolute",
          zIndex: -1,
        },
      }}
    >
      {ambientSensors.map((sensor) => (
        <Box
          key={sensor.label}
          aria-hidden
          sx={{
            alignItems: "center",
            animation: `bioems-opening-float 3.8s ease-in-out ${sensor.delay} infinite`,
            backdropFilter: "blur(8px)",
            background: "rgba(5, 36, 52, .56)",
            border: "1px solid rgba(85, 209, 205, .38)",
            borderRadius: "50%",
            boxShadow:
              "inset 0 0 18px rgba(85, 209, 205, .1), 0 0 24px rgba(32, 166, 188, .13)",
            color: "#9BE5E2",
            display: { xs: "none", md: "flex" },
            fontSize: sensor.label === "⌁" ? "2rem" : ".8rem",
            fontWeight: 700,
            height: 68,
            justifyContent: "center",
            position: "absolute",
            width: 68,
            ...sensor,
          }}
        >
          {sensor.label}
        </Box>
      ))}

      <Box
        component="svg"
        aria-hidden
        viewBox="0 0 1200 220"
        preserveAspectRatio="none"
        sx={{
          animation: "bioems-opening-wave 5s ease-in-out infinite",
          bottom: "8%",
          height: { xs: 130, md: 210 },
          insetInline: "-5%",
          overflow: "visible",
          position: "absolute",
          width: "110%",
          zIndex: -1,
        }}
      >
        <defs>
          <linearGradient id="opening-wave-gradient" x1="0" x2="1">
            <stop offset="0" stopColor="#168FD0" stopOpacity="0" />
            <stop offset=".32" stopColor="#18A6A6" stopOpacity=".75" />
            <stop offset=".68" stopColor="#55D1CD" stopOpacity=".9" />
            <stop offset="1" stopColor="#168FD0" stopOpacity="0" />
          </linearGradient>
          <filter id="opening-wave-glow">
            <feGaussianBlur stdDeviation="5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <path
          d="M0 140 C120 138 150 115 210 132 S300 165 360 126 S470 80 530 126 S610 180 680 118 S790 58 850 119 S955 171 1015 126 S1110 99 1200 118"
          fill="none"
          filter="url(#opening-wave-glow)"
          stroke="url(#opening-wave-gradient)"
          strokeWidth="3"
        />
        <path
          d="M0 158 C150 151 205 126 280 149 S430 175 510 145 S690 115 770 149 S920 179 1010 144 S1120 132 1200 144"
          fill="none"
          stroke="url(#opening-wave-gradient)"
          strokeOpacity=".45"
          strokeWidth="1.5"
        />
      </Box>

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
        <Box
          aria-hidden
          sx={{
            background:
              "radial-gradient(circle, rgba(85,209,205,.2), transparent 68%)",
            height: 360,
            position: "absolute",
            top: -90,
            width: 620,
            zIndex: -1,
          }}
        />
        <BrandLogo
          sx={{
            filter:
              "drop-shadow(0 14px 34px rgba(0, 0, 0, .42)) drop-shadow(0 0 28px rgba(45, 183, 198, .14))",
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
            textShadow: "0 2px 16px rgba(0,0,0,.55)",
          }}
        >
          {resources.opening.subtitle}
        </Typography>
        <LinearProgress
          aria-label={resources.opening.loading}
          sx={{
            bgcolor: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(85,209,205,.18)",
            borderRadius: 10,
            boxShadow: "0 0 24px rgba(37, 199, 193, .18)",
            height: 5,
            mt: 9,
            overflow: "hidden",
            width: { xs: "78%", sm: 360 },
            "& .MuiLinearProgress-bar": {
              background: "linear-gradient(90deg, #168FD0, #18A6A6, #54D59A)",
              boxShadow: "0 0 18px rgba(84, 213, 154, .7)",
            },
          }}
        />
        <Typography
          sx={{ color: "#A8CDD4", letterSpacing: 0.35, mt: 3 }}
          variant="body2"
        >
          {resources.opening.loading}
        </Typography>
      </Box>
    </Box>
  );
}
