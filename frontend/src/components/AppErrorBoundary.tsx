import { Alert, Box, Button, Typography } from "@mui/material";
import { Component, type ErrorInfo, type PropsWithChildren } from "react";

interface State {
  hasError: boolean;
}

export interface ErrorBoundaryFallbackCopy {
  title: string;
  reload: string;
}

interface AppErrorBoundaryProps extends PropsWithChildren {
  fallbackCopy: ErrorBoundaryFallbackCopy;
}

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo) {
    // Observability is integrated separately; never log user data here.
    void _error;
    void _info;
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box
          component="main"
          sx={{ margin: "auto", maxWidth: 720, padding: 4 }}
        >
          <Alert severity="error">
            <Typography component="h1" variant="h5">
              {this.props.fallbackCopy.title}
            </Typography>
            <Button onClick={() => window.location.reload()}>
              {this.props.fallbackCopy.reload}
            </Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
