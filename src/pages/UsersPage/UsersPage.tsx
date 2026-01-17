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
  InputAdornment,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@mui/material';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import SearchIcon from '@mui/icons-material/Search';
import { useSnackbar } from 'notistack';
import { DynamicGrid, UserActions, ErrorDisplay } from '@/components';
import { useUsers, useUpdateUserStatus, useDebounce, useOnlineStatus } from '@/hooks';
import { userColumnMetadata } from '@/utils';
import type { MRT_PaginationState } from 'material-react-table';
import type { User, ColumnMetadata } from '@/types';

/**
 * Loading skeleton for the users table
 */
const TableSkeleton: React.FC<{ rowCount?: number }> = ({ rowCount = 10 }) => {
  const columns = [
    { header: 'Name', width: 220 },
    { header: 'Email', width: 260 },
    { header: 'Status', width: 120 },
    { header: 'Joined', width: 140 },
    { header: 'Groups', width: 280 },
    { header: 'Actions', width: 100 },
  ];

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.header} sx={{ width: col.width }}>
                {col.header}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from({ length: rowCount }).map((_, rowIndex) => (
            <TableRow key={rowIndex}>
              <TableCell>
                <Skeleton variant="text" width={180} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={200} />
              </TableCell>
              <TableCell>
                <Skeleton variant="rounded" width={60} height={24} />
              </TableCell>
              <TableCell>
                <Skeleton variant="text" width={100} />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Skeleton variant="rounded" width={70} height={24} />
                  <Skeleton variant="rounded" width={70} height={24} />
                </Box>
              </TableCell>
              <TableCell>
                <Skeleton variant="circular" width={32} height={32} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Empty state when no users match the search/filter criteria
 */
const EmptyState: React.FC<{
  searchQuery: string;
  statusFilter: string;
  onClearFilters: () => void;
}> = ({ searchQuery, statusFilter, onClearFilters }) => {
  const hasFilters = searchQuery || statusFilter !== 'all';

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        py: 8,
        px: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
      <Typography variant="h6" color="text.secondary" gutterBottom>
        No users found
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ mb: 3, textAlign: 'center' }}>
        {hasFilters
          ? `No users match your search${searchQuery ? ` "${searchQuery}"` : ''}${statusFilter !== 'all' ? ` with status "${statusFilter}"` : ''}`
          : 'There are no users to display'}
      </Typography>
      {hasFilters && (
        <Button variant="outlined" size="small" onClick={onClearFilters}>
          Clear Filters
        </Button>
      )}
    </Box>
  );
};

/**
 * Users Page Component
 *
 * Displays a paginated, filterable list of users with:
 * - Search with debouncing
 * - Status filtering
 * - Pagination synced with URL
 * - Loading skeletons
 * - Error handling with retry
 */
export const UsersPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { enqueueSnackbar } = useSnackbar();
  const isOnline = useOnlineStatus();

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

  // Debounce search query to prevent API calls on every keystroke
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Fetch users with debounced search
  const { data, isLoading, error, refetch } = useUsers({
    page: pagination.pageIndex + 1,
    pageSize: pagination.pageSize,
    query: debouncedSearchQuery,
    status: statusFilter,
  });

  // Update user status mutation
  const { mutate: updateStatus, isPending: isUpdating } = useUpdateUserStatus();

  // Handle status toggle with network check
  const handleToggleStatus = (userId: string, newStatus: 'active' | 'inactive') => {
    // Check if user is online before attempting action
    if (!isOnline) {
      enqueueSnackbar('No internet connection. Please check your network and try again.', {
        variant: 'error',
      });
      return;
    }

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

  // Handle search input change
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

  // Handle clear filters
  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    setSearchParams({});
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

  // Error state with retry functionality
  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Users
        </Typography>
        <Paper sx={{ p: 2 }}>
          <ErrorDisplay
            error={error}
            title="Failed to load users"
            onRetry={() => refetch()}
          />
        </Paper>
      </Box>
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
          {/* Search Input */}
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
        {isLoading ? (
          <TableSkeleton rowCount={pagination.pageSize} />
        ) : usersWithActions.length === 0 ? (
          <EmptyState
            searchQuery={debouncedSearchQuery}
            statusFilter={statusFilter}
            onClearFilters={handleClearFilters}
          />
        ) : (
          <DynamicGrid
            data={usersWithActions}
            columns={columnsWithActions}
            isLoading={false}
            totalCount={data?.data?.totalCount || 0}
            pagination={pagination}
            onPaginationChange={handlePaginationChange}
          />
        )}
      </Paper>
    </Box>
  );
};
