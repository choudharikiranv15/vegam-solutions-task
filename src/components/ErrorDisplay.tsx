import React from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  title?: string;
}

/**
 * Determines error type and returns appropriate message and icon
 */
const getErrorDetails = (error: Error) => {
  const message = error.message.toLowerCase();

  // Network/Connection errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('net::')
  ) {
    return {
      type: 'network',
      title: 'Connection Error',
      description: 'Unable to connect to the server. Please check your internet connection and try again.',
      icon: WifiOffIcon,
      severity: 'warning' as const,
    };
  }

  // Server errors (5xx)
  if (message.includes('500') || message.includes('server error')) {
    return {
      type: 'server',
      title: 'Server Error',
      description: 'The server encountered an error. Our team has been notified. Please try again later.',
      icon: CloudOffIcon,
      severity: 'error' as const,
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return {
      type: 'timeout',
      title: 'Request Timeout',
      description: 'The request took too long to complete. Please try again.',
      icon: CloudOffIcon,
      severity: 'warning' as const,
    };
  }

  // Not found errors (404)
  if (message.includes('404') || message.includes('not found')) {
    return {
      type: 'notFound',
      title: 'Not Found',
      description: 'The requested resource could not be found.',
      icon: ErrorOutlineIcon,
      severity: 'info' as const,
    };
  }

  // Default/Unknown errors
  return {
    type: 'unknown',
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred. Please try again.',
    icon: ErrorOutlineIcon,
    severity: 'error' as const,
  };
};

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages with:
 * - Appropriate icons based on error type
 * - Clear, helpful error descriptions
 * - Retry button for recoverable errors
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  title,
}) => {
  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        p: 3,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          maxWidth: 500,
          width: '100%',
        }}
      >
        <Alert
          severity={errorDetails.severity}
          icon={<IconComponent fontSize="large" />}
          sx={{
            alignItems: 'flex-start',
            '& .MuiAlert-icon': {
              pt: 1,
            },
          }}
        >
          <AlertTitle sx={{ fontWeight: 600 }}>
            {title || errorDetails.title}
          </AlertTitle>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {errorDetails.description}
          </Typography>

          {/* Technical details (collapsible in production) */}
          {import.meta.env.DEV && (
            <Typography
              variant="caption"
              sx={{
                display: 'block',
                mb: 2,
                p: 1,
                backgroundColor: 'rgba(0,0,0,0.04)',
                borderRadius: 1,
                fontFamily: 'monospace',
                wordBreak: 'break-word',
              }}
            >
              {error.message}
            </Typography>
          )}

          {onRetry && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
              color={errorDetails.severity === 'error' ? 'error' : 'primary'}
            >
              Try Again
            </Button>
          )}
        </Alert>
      </Paper>
    </Box>
  );
};
