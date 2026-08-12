import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo, type PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { AuthenticationProvider } from "../auth/AuthenticationProvider";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { LocalizationProvider } from "../localization/LocalizationProvider";
import { englishResources } from "../localization/resources";
import { useLocalization } from "../localization/useLocalization";
import { createAppTheme } from "../theme/theme";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <AppErrorBoundary fallbackCopy={englishResources.errorBoundary}>
      <LocalizationProvider>
        <LocalizedAppProviders>{children}</LocalizedAppProviders>
      </LocalizationProvider>
    </AppErrorBoundary>
  );
}

function LocalizedAppProviders({ children }: PropsWithChildren) {
  const { direction } = useLocalization();
  const theme = useMemo(() => createAppTheme(direction), [direction]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <QueryClientProvider client={queryClient}>
        <AuthenticationProvider>
          <BrowserRouter>{children}</BrowserRouter>
        </AuthenticationProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
