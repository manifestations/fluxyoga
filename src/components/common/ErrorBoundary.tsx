import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
} from '@mui/material';
import {
  Error as ErrorIcon,
  ExpandMore as ExpandMoreIcon,
  Refresh as RefreshIcon,
  BugReport as BugReportIcon,
} from '@mui/icons-material';

interface Props {
  children: ReactNode;
  fallbackComponent?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
    
    this.setState({
      error,
      errorInfo,
    });

    // Log error to file if API is available
    if ((window as any).api?.logger?.error) {
      (window as any).api.logger.error('React Error Boundary', {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
        errorInfo,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    }
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReportBug = () => {
    const { error, errorInfo, errorId } = this.state;
    const bugReport = {
      errorId,
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    // Copy to clipboard
    navigator.clipboard.writeText(JSON.stringify(bugReport, null, 2))
      .then(() => {
        alert('Error report copied to clipboard. Please paste it when reporting the bug.');
      })
      .catch(() => {
        console.error('Failed to copy error report to clipboard');
      });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallbackComponent) {
        return this.props.fallbackComponent;
      }

      return (
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            bgcolor: 'background.default',
            p: 3,
          }}
        >
          <Card sx={{ maxWidth: 600, width: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <ErrorIcon color="error" sx={{ fontSize: 40 }} />
                <Box>
                  <Typography variant="h5" component="h1" gutterBottom>
                    Something went wrong
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Error ID: {this.state.errorId}
                  </Typography>
                </Box>
              </Box>

              <Alert severity="error" sx={{ mb: 3 }}>
                <Typography variant="body2">
                  The application encountered an unexpected error. You can try reloading the page or
                  resetting the current state. If the problem persists, please report this bug.
                </Typography>
              </Alert>

              <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
                <Button
                  variant="contained"
                  onClick={this.handleReload}
                  startIcon={<RefreshIcon />}
                >
                  Reload Application
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReset}
                >
                  Try Again
                </Button>
                <Button
                  variant="outlined"
                  onClick={this.handleReportBug}
                  startIcon={<BugReportIcon />}
                  color="info"
                >
                  Copy Error Report
                </Button>
              </Box>

              {this.state.error && (
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Typography variant="subtitle2">
                        Technical Details
                      </Typography>
                      <Chip label="For Developers" size="small" color="info" />
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Error Message:
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          p: 2,
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                          border: '1px solid',
                          borderColor: 'divider',
                          mb: 2,
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {this.state.error.name}: {this.state.error.message}
                      </Typography>

                      {this.state.error.stack && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Stack Trace:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              mb: 2,
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.8rem',
                              maxHeight: 200,
                              overflow: 'auto',
                            }}
                          >
                            {this.state.error.stack}
                          </Typography>
                        </>
                      )}

                      {this.state.errorInfo && (
                        <>
                          <Typography variant="subtitle2" gutterBottom>
                            Component Stack:
                          </Typography>
                          <Typography
                            variant="body2"
                            sx={{
                              fontFamily: 'monospace',
                              p: 2,
                              bgcolor: 'background.paper',
                              borderRadius: 1,
                              border: '1px solid',
                              borderColor: 'divider',
                              whiteSpace: 'pre-wrap',
                              fontSize: '0.8rem',
                              maxHeight: 200,
                              overflow: 'auto',
                            }}
                          >
                            {this.state.errorInfo.componentStack}
                          </Typography>
                        </>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              )}
            </CardContent>
          </Card>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
