import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button, Paper } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import RefreshIcon from '@mui/icons-material/Refresh';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 *
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px',
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              p: 4,
              textAlign: 'center',
              maxWidth: 500,
              backgroundColor: 'error.lighter',
              border: '1px solid',
              borderColor: 'error.light',
              borderRadius: 2,
            }}
          >
            <ErrorOutlineIcon
              sx={{ fontSize: 64, color: 'error.main', mb: 2 }}
            />
            <Typography variant="h5" gutterBottom color="error.dark">
              Something went wrong
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
              An unexpected error occurred. Please try refreshing the page.
            </Typography>
            {this.state.error && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  display: 'block',
                  mb: 3,
                  p: 1,
                  backgroundColor: 'grey.100',
                  borderRadius: 1,
                  fontFamily: 'monospace',
                }}
              >
                {this.state.error.message}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={<RefreshIcon />}
              onClick={this.handleReset}
            >
              Try Again
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}
