import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CssBaseline, ThemeProvider } from "@mui/material";
import { useMemo, type PropsWithChildren } from "react";
import { BrowserRouter } from "react-router-dom";
import { AppErrorBoundary } from "../components/AppErrorBoundary";
import { LocalizationProvider } from "../localization/LocalizationProvider";
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
    <AppErrorBoundary>
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
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
