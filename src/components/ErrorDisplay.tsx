import React from 'react';
import { Box, Typography, Button, Paper, Alert, AlertTitle, Stack } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import BlockIcon from '@mui/icons-material/Block';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import StorageIcon from '@mui/icons-material/Storage';
import SpeedIcon from '@mui/icons-material/Speed';
import BugReportIcon from '@mui/icons-material/BugReport';
import HomeIcon from '@mui/icons-material/Home';

interface ErrorDisplayProps {
  error: Error;
  onRetry?: () => void;
  onGoHome?: () => void;
  title?: string;
  compact?: boolean;
}

interface ErrorDetails {
  type: string;
  title: string;
  description: string;
  suggestion: string;
  icon: React.ElementType;
  severity: 'error' | 'warning' | 'info' | 'success';
  canRetry: boolean;
}

/**
 * Determines error type and returns appropriate message and icon
 */
const getErrorDetails = (error: Error): ErrorDetails => {
  const message = error.message.toLowerCase();

  // Offline/No internet connection
  if (!navigator.onLine) {
    return {
      type: 'offline',
      title: 'You Are Offline',
      description: 'It looks like you\'ve lost your internet connection.',
      suggestion: 'Check your Wi-Fi or mobile data connection and try again.',
      icon: WifiOffIcon,
      severity: 'warning',
      canRetry: true,
    };
  }

  // Network/Connection errors
  if (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('failed to fetch') ||
    message.includes('net::') ||
    message.includes('err_internet_disconnected') ||
    message.includes('networkerror')
  ) {
    return {
      type: 'network',
      title: 'Connection Failed',
      description: 'Unable to reach the server. This could be a temporary issue.',
      suggestion: 'Check your internet connection or try again in a few moments.',
      icon: WifiOffIcon,
      severity: 'warning',
      canRetry: true,
    };
  }

  // Server errors (5xx)
  if (
    message.includes('500') ||
    message.includes('502') ||
    message.includes('503') ||
    message.includes('504') ||
    message.includes('server error') ||
    message.includes('internal server')
  ) {
    return {
      type: 'server',
      title: 'Server Error',
      description: 'Our servers are having trouble processing your request.',
      suggestion: 'This is on our end. Please wait a moment and try again.',
      icon: StorageIcon,
      severity: 'error',
      canRetry: true,
    };
  }

  // Service unavailable
  if (message.includes('service unavailable') || message.includes('maintenance')) {
    return {
      type: 'maintenance',
      title: 'Service Temporarily Unavailable',
      description: 'The service is currently undergoing maintenance.',
      suggestion: 'Please check back in a few minutes.',
      icon: CloudOffIcon,
      severity: 'info',
      canRetry: true,
    };
  }

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out') || message.includes('aborted')) {
    return {
      type: 'timeout',
      title: 'Request Timed Out',
      description: 'The server took too long to respond.',
      suggestion: 'This might be due to a slow connection. Try again or wait a moment.',
      icon: SpeedIcon,
      severity: 'warning',
      canRetry: true,
    };
  }

  // Authentication errors (401)
  if (message.includes('401') || message.includes('unauthorized') || message.includes('unauthenticated')) {
    return {
      type: 'auth',
      title: 'Authentication Required',
      description: 'You need to be logged in to access this resource.',
      suggestion: 'Please log in again to continue.',
      icon: LockOutlinedIcon,
      severity: 'warning',
      canRetry: false,
    };
  }

  // Forbidden errors (403)
  if (message.includes('403') || message.includes('forbidden') || message.includes('access denied')) {
    return {
      type: 'forbidden',
      title: 'Access Denied',
      description: 'You don\'t have permission to access this resource.',
      suggestion: 'Contact your administrator if you believe this is an error.',
      icon: BlockIcon,
      severity: 'error',
      canRetry: false,
    };
  }

  // Not found errors (404)
  if (message.includes('404') || message.includes('not found')) {
    return {
      type: 'notFound',
      title: 'Not Found',
      description: 'The page or resource you\'re looking for doesn\'t exist.',
      suggestion: 'Check the URL or go back to the homepage.',
      icon: ErrorOutlineIcon,
      severity: 'info',
      canRetry: false,
    };
  }

  // Rate limiting (429)
  if (message.includes('429') || message.includes('too many requests') || message.includes('rate limit')) {
    return {
      type: 'rateLimit',
      title: 'Too Many Requests',
      description: 'You\'ve made too many requests in a short period.',
      suggestion: 'Please wait a minute before trying again.',
      icon: SpeedIcon,
      severity: 'warning',
      canRetry: true,
    };
  }

  // Validation errors (400)
  if (message.includes('400') || message.includes('bad request') || message.includes('validation')) {
    return {
      type: 'validation',
      title: 'Invalid Request',
      description: 'There was a problem with the data sent to the server.',
      suggestion: 'Check your input and try again.',
      icon: ErrorOutlineIcon,
      severity: 'warning',
      canRetry: false,
    };
  }

  // CORS errors
  if (message.includes('cors') || message.includes('cross-origin')) {
    return {
      type: 'cors',
      title: 'Connection Blocked',
      description: 'The request was blocked due to security restrictions.',
      suggestion: 'This is a configuration issue. Please contact support.',
      icon: BlockIcon,
      severity: 'error',
      canRetry: false,
    };
  }

  // Default/Unknown errors
  return {
    type: 'unknown',
    title: 'Something Went Wrong',
    description: 'An unexpected error occurred while processing your request.',
    suggestion: 'Try refreshing the page. If the problem persists, contact support.',
    icon: BugReportIcon,
    severity: 'error',
    canRetry: true,
  };
};

/**
 * ErrorDisplay Component
 *
 * Displays user-friendly error messages with:
 * - Appropriate icons based on error type
 * - Clear, helpful error descriptions
 * - Actionable suggestions for users
 * - Retry button for recoverable errors
 * - Optional "Go Home" button for navigation errors
 */
export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  onRetry,
  onGoHome,
  title,
  compact = false,
}) => {
  const errorDetails = getErrorDetails(error);
  const IconComponent = errorDetails.icon;
  const showRetry = onRetry && errorDetails.canRetry;

  if (compact) {
    return (
      <Alert
        severity={errorDetails.severity}
        icon={<IconComponent />}
        action={
          showRetry && (
            <Button
              color="inherit"
              size="small"
              startIcon={<RefreshIcon />}
              onClick={onRetry}
            >
              Retry
            </Button>
          )
        }
      >
        <AlertTitle sx={{ fontWeight: 600, fontSize: '0.875rem' }}>
          {title || errorDetails.title}
        </AlertTitle>
        <Typography variant="body2">{errorDetails.suggestion}</Typography>
      </Alert>
    );
  }

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

          <Typography variant="body2" sx={{ mb: 1 }}>
            {errorDetails.description}
          </Typography>

          <Typography
            variant="body2"
            sx={{
              mb: 2,
              color: 'text.secondary',
              fontStyle: 'italic',
            }}
          >
            {errorDetails.suggestion}
          </Typography>

          {/* Technical details (only in development) */}
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

          <Stack direction="row" spacing={1}>
            {showRetry && (
              <Button
                variant="contained"
                size="small"
                startIcon={<RefreshIcon />}
                onClick={onRetry}
                color={errorDetails.severity === 'error' ? 'error' : 'primary'}
              >
                Try Again
              </Button>
            )}

            {onGoHome && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<HomeIcon />}
                onClick={onGoHome}
              >
                Go to Homepage
              </Button>
            )}
          </Stack>
        </Alert>
      </Paper>
    </Box>
  );
};
