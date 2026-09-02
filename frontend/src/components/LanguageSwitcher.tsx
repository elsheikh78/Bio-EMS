import { Button } from "@mui/material";
import { useLocalization } from "../localization/useLocalization";

export function LanguageSwitcher() {
  const { language, setLanguage } = useLocalization();
  const arabic = language === "ar";

  return (
    <Button
      aria-label={
        arabic ? "Switch language to English" : "تغيير اللغة إلى العربية"
      }
      onClick={() => setLanguage(arabic ? "en" : "ar")}
      size="small"
      variant="contained"
      sx={{
        bottom: 16,
        insetInlineEnd: 16,
        minWidth: 64,
        position: "fixed",
        zIndex: (theme) => theme.zIndex.tooltip,
      }}
    >
      {arabic ? "English" : "العربية"}
    </Button>
  );
}
