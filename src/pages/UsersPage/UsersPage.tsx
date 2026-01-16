import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Alert,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';
import { DynamicGrid, UserActions } from '@/components';
import { useUsers, useUpdateUserStatus } from '@/hooks';
import { userColumnMetadata } from '@/utils';
import type { MRT_PaginationState } from 'material-react-table';
import type { User, ColumnMetadata } from '@/types';

/**
 * Users Page Component
 *
 * Displays a paginated, filterable list of users.
 *
 * INCOMPLETE FEATURES:
 *
 * 1. Search is not debounced - API is called on every keystroke.
 * 2. No loading skeleton - just shows spinner.
 * 3. No error boundary or proper error UI.
 */
export const UsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();

  // Initialize state from URL params
  const initialPage = parseInt(searchParams.get('page') || '1') - 1;
  const initialStatus = (searchParams.get('status') as 'all' | 'active' | 'inactive') || 'all';
  const initialQuery = searchParams.get('query') || '';

  // Local state for filters - initialized from URL
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>(initialStatus);
  const [pagination, setPagination] = useState<MRT_PaginationState>({
    pageIndex: initialPage,
    pageSize: 10,
  });

  // Fetch users - BUG: Search is not debounced!
  // TODO: Use the useDebounce hook to debounce the search query
  const { data, isLoading, error } = useUsers({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    query: searchQuery, // BUG: This updates on every keystroke
    status: statusFilter,
  });

  // Update user status mutation
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateUserStatus();

  // Handle status toggle
  const handleToggleStatus = (userId: string, newStatus: 'active' | 'inactive') => {
    updateStatus(
      { userId, status: newStatus },
      {
        onSuccess: (response) => {
          enqueueSnackbar(response.message, { variant: 'success' });
        },
        onError: () => {
          enqueueSnackbar('Failed to update user status', { variant: 'error' });
        },
      }
    );
  };

  // Handle search input change - TODO: Add debouncing
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);
    // Reset to first page when searching
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // Update URL params
    setSearchParams((params) => {
      params.set('page', '1');
      if (value) {
        params.set('query', value);
      } else {
        params.delete('query');
      }
      return params;
    });
  };

  // Handle status filter change
  const handleStatusFilterChange = (value: 'all' | 'active' | 'inactive') => {
    setStatusFilter(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // Update URL params
    setSearchParams((params) => {
      params.set('page', '1');
      if (value === 'all') {
        params.delete('status');
      } else {
        params.set('status', value);
      }
      return params;
    });
  };

  // Handle pagination change
  const handlePaginationChange = (newPagination: MRT_PaginationState) => {
    setPagination(newPagination);
    // Update URL params
    setSearchParams((params) => {
      const pageNum = newPagination.pageIndex + 1;
      if (pageNum === 1) {
        params.delete('page');
      } else {
        params.set('page', pageNum.toString());
      }
      return params;
    });
  };

  // Add actions column to metadata
  const columnsWithActions: ColumnMetadata[] = [
    ...userColumnMetadata,
    {
      key: 'actions',
      header: 'Actions',
      type: 'string',
      width: 100,
    },
  ];

  // Transform data to include actions renderer
  const usersWithActions = (data?.data?.users || []).map((user: User) => ({
    ...user,
    actions: (
      <UserActions
        user={user}
        onToggleStatus={handleToggleStatus}
        isUpdating={isUpdating}
      />
    ),
  }));

  // Error state - TODO: Improve error UI
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        Failed to load users: {error.message}
      </Alert>
    );
  }

  return (
    <Box>
      {/* Page Header */}
      <Typography variant="h4" component="h1" gutterBottom>
        Users
      </Typography>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* Search Input - BUG: Not debounced! */}
          <TextField
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={handleSearchChange}
            size="small"
            sx={{ minWidth: 300 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />

          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Status</InputLabel>
            <Select
              value={statusFilter}
              label="Status"
              onChange={(e) =>
                handleStatusFilterChange(e.target.value as 'all' | 'active' | 'inactive')
              }
            >
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </Select>
          </FormControl>

          {/* Results Count */}
          <Box sx={{ display: 'flex', alignItems: 'center', ml: 'auto' }}>
            <Typography variant="body2" color="text.secondary">
              {data?.data?.totalCount || 0} users found
            </Typography>
          </Box>
        </Box>
      </Paper>

      {/* Users Table */}
      <Paper>
        <DynamicGrid
          data={usersWithActions}
          columns={columnsWithActions}
          isLoading={isLoading}
          totalCount={data?.data?.totalCount || 0}
          pagination={pagination}
          onPaginationChange={handlePaginationChange}
        />
      </Paper>
    </Box>
  );
};
