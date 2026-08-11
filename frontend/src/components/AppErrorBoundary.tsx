import { Alert, Box, Button, Typography } from "@mui/material";
import { Component, type ErrorInfo, type PropsWithChildren } from "react";

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<PropsWithChildren, State> {
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
              The application could not start
            </Typography>
            <Button onClick={() => window.location.reload()}>Reload</Button>
          </Alert>
        </Box>
      );
    }

    return this.props.children;
  }
}
