import React, { useEffect, useState } from 'react';
import { Alert, Collapse, IconButton, Box, LinearProgress, Typography } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';
import CloseIcon from '@mui/icons-material/Close';
import { useOnlineStatus } from '@/hooks';

/**
 * OfflineBanner Component
 *
 * Displays a persistent banner when the user goes offline.
 * Shows a reconnection message when back online.
 * Features:
 * - Smooth slide animation
 * - Auto-dismiss when reconnected (after brief confirmation)
 * - Manual dismiss option
 * - Visual feedback during reconnection
 */
export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [showBanner, setShowBanner] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowBanner(true);
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline && isOnline) {
      // User just came back online
      setShowReconnected(true);
      setShowBanner(true);

      // Auto-hide after 3 seconds
      const timer = setTimeout(() => {
        setShowBanner(false);
        setWasOffline(false);
        setShowReconnected(false);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  const handleClose = () => {
    if (isOnline) {
      setShowBanner(false);
      setWasOffline(false);
      setShowReconnected(false);
    }
  };

  return (
    <Collapse in={showBanner}>
      <Alert
        severity={showReconnected ? 'success' : 'warning'}
        icon={showReconnected ? <SignalWifiStatusbar4BarIcon /> : <WifiOffIcon />}
        action={
          isOnline && (
            <IconButton
              aria-label="close"
              color="inherit"
              size="small"
              onClick={handleClose}
            >
              <CloseIcon fontSize="inherit" />
            </IconButton>
          )
        }
        sx={{
          borderRadius: 0,
          '& .MuiAlert-message': {
            width: '100%',
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {showReconnected ? (
            <Typography variant="body2">
              You're back online! Your connection has been restored.
            </Typography>
          ) : (
            <>
              <Typography variant="body2" sx={{ flexGrow: 1 }}>
                <strong>No internet connection.</strong> Some features may be unavailable.
                Please check your network settings.
              </Typography>
              <Box sx={{ width: 100, ml: 2 }}>
                <LinearProgress color="warning" />
              </Box>
            </>
          )}
        </Box>
      </Alert>
    </Collapse>
  );
};
