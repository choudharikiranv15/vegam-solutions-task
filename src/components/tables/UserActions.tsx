import React, { useState } from 'react';
import {
  IconButton,
  Tooltip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { User } from '@/types';

interface UserActionsProps {
  user: User;
  onToggleStatus: (userId: string, newStatus: 'active' | 'inactive') => void;
  isUpdating?: boolean;
}

/**
 * UserActions Component
 *
 * Renders action buttons for a user row with:
 * - Hover states for better visual feedback
 * - Confirmation dialog before deactivating users
 * - Full accessibility support (aria labels, keyboard navigation)
 */
export const UserActions: React.FC<UserActionsProps> = ({
  user,
  onToggleStatus,
  isUpdating = false,
}) => {
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);

  const isActive = user.status === 'active';

  const handleToggleClick = () => {
    if (isActive) {
      // Show confirmation dialog before deactivating
      setConfirmDialogOpen(true);
    } else {
      // Activate directly without confirmation
      onToggleStatus(user.userId, 'active');
    }
  };

  const handleConfirmDeactivate = () => {
    setConfirmDialogOpen(false);
    onToggleStatus(user.userId, 'inactive');
  };

  const handleCancelDeactivate = () => {
    setConfirmDialogOpen(false);
  };

  if (isUpdating) {
    return (
      <CircularProgress
        size={20}
        aria-label="Updating user status"
        role="status"
      />
    );
  }

  return (
    <>
      <Tooltip
        title={isActive ? 'Deactivate User' : 'Activate User'}
        arrow
        placement="top"
      >
        <IconButton
          onClick={handleToggleClick}
          color={isActive ? 'error' : 'success'}
          size="small"
          aria-label={
            isActive
              ? `Deactivate user ${user.name}`
              : `Activate user ${user.name}`
          }
          aria-describedby={isActive ? 'deactivate-warning' : undefined}
          sx={{
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              transform: 'scale(1.15)',
              backgroundColor: isActive
                ? 'rgba(211, 47, 47, 0.12)'
                : 'rgba(46, 125, 50, 0.12)',
            },
            '&:focus-visible': {
              outline: '2px solid',
              outlineColor: isActive ? 'error.main' : 'success.main',
              outlineOffset: '2px',
            },
          }}
        >
          {isActive ? <CancelIcon /> : <CheckCircleIcon />}
        </IconButton>
      </Tooltip>

      {/* Confirmation Dialog for Deactivation */}
      <Dialog
        open={confirmDialogOpen}
        onClose={handleCancelDeactivate}
        aria-labelledby="deactivate-dialog-title"
        aria-describedby="deactivate-dialog-description"
      >
        <DialogTitle id="deactivate-dialog-title">
          Deactivate User?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="deactivate-dialog-description">
            Are you sure you want to deactivate <strong>{user.name}</strong>?
            This user will no longer be able to access the system until reactivated.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleCancelDeactivate}
            color="inherit"
            autoFocus
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmDeactivate}
            color="error"
            variant="contained"
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
