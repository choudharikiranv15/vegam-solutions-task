import { useMemo, useState, useCallback } from 'react';
import {
  MaterialReactTable,
  useMaterialReactTable,
  type MRT_ColumnDef,
  type MRT_PaginationState,
  type MRT_VisibilityState,
  type MRT_SortingState,
} from 'material-react-table';
import { Chip, Box } from '@mui/material';
import type { ColumnMetadata, User, Group } from '@/types';
import { formatDate } from '@/utils';

// localStorage keys for persisting table state
const STORAGE_KEYS = {
  COLUMN_VISIBILITY: 'users-table-column-visibility',
  SORTING: 'users-table-sorting',
};

/**
 * Load state from localStorage
 */
const loadFromStorage = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
};

/**
 * Save state to localStorage
 */
const saveToStorage = <T,>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore storage errors
  }
};

interface DynamicGridProps {
  data: User[];
  columns: ColumnMetadata[];
  isLoading?: boolean;
  totalCount: number;
  pagination: MRT_PaginationState;
  onPaginationChange: (pagination: MRT_PaginationState) => void;
  onRowAction?: (user: User, action: string) => void;
}

/**
 * Renders cell content based on column type
 */
const renderCellByType = (
  value: unknown,
  columnMeta: ColumnMetadata
): React.ReactNode => {
  switch (columnMeta.type) {
    case 'string':
      return value as string;

    case 'badge':
      const status = value as 'active' | 'inactive';
      return (
        <Chip
          label={status}
          size="small"
          color={status === 'active' ? 'success' : 'default'}
          sx={{ textTransform: 'capitalize' }}
        />
      );

    case 'date':
      return formatDate(value as string, columnMeta.format);

    case 'chiplist':
      const groups = value as Group[];
      if (!groups || groups.length === 0) {
        return <span style={{ color: '#999' }}>No groups</span>;
      }

      return (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
          {groups.map((group) => (
            <Chip
              key={group.groupId}
              label={group.groupName}
              size="small"
              variant="outlined"
            />
          ))}
        </Box>
      );

    default:
      return String(value);
  }
};

/**
 * DynamicGrid Component
 *
 * A metadata-driven data grid using Material React Table.
 * Columns are generated dynamically based on the provided metadata.
 *
 * Features:
 * - Dynamic column generation from metadata
 * - Custom cell renderers for different data types
 * - Server-side pagination
 * - Sorting support
 * - Persisted column visibility and sort order (localStorage)
 */
export const DynamicGrid: React.FC<DynamicGridProps> = ({
  data,
  columns,
  isLoading = false,
  totalCount,
  pagination,
  onPaginationChange,
}) => {
  // Load persisted state from localStorage
  const [columnVisibility, setColumnVisibility] = useState<MRT_VisibilityState>(
    () => loadFromStorage(STORAGE_KEYS.COLUMN_VISIBILITY, {})
  );
  const [sorting, setSorting] = useState<MRT_SortingState>(
    () => loadFromStorage(STORAGE_KEYS.SORTING, [])
  );

  // Persist column visibility changes
  const handleColumnVisibilityChange = useCallback(
    (updater: MRT_VisibilityState | ((old: MRT_VisibilityState) => MRT_VisibilityState)) => {
      setColumnVisibility((prev) => {
        const newValue = typeof updater === 'function' ? updater(prev) : updater;
        saveToStorage(STORAGE_KEYS.COLUMN_VISIBILITY, newValue);
        return newValue;
      });
    },
    []
  );

  // Persist sorting changes
  const handleSortingChange = useCallback(
    (updater: MRT_SortingState | ((old: MRT_SortingState) => MRT_SortingState)) => {
      setSorting((prev) => {
        const newValue = typeof updater === 'function' ? updater(prev) : updater;
        saveToStorage(STORAGE_KEYS.SORTING, newValue);
        return newValue;
      });
    },
    []
  );

  // Generate MRT columns from metadata
  const tableColumns = useMemo<MRT_ColumnDef<User>[]>(() => {
    return columns.map((colMeta) => ({
      accessorKey: colMeta.key,
      header: colMeta.header,
      size: colMeta.width,
      enableSorting: colMeta.sorting ?? false,
      enablePinning: !!colMeta.pinned,
      enableHiding: true,
      Cell: ({ cell }) => {
        const value = cell.getValue();
        return renderCellByType(value, colMeta);
      },
    }));
  }, [columns]);

  const table = useMaterialReactTable({
    columns: tableColumns,
    data,
    enableRowSelection: false,
    enableColumnFilters: false,
    enableGlobalFilter: false,
    enableHiding: true,
    manualPagination: true,
    manualSorting: false,
    rowCount: totalCount,
    state: {
      isLoading,
      pagination,
      columnVisibility,
      sorting,
    },
    onColumnVisibilityChange: handleColumnVisibilityChange,
    onSortingChange: handleSortingChange,
    onPaginationChange: (updater) => {
      const newPagination =
        typeof updater === 'function' ? updater(pagination) : updater;
      onPaginationChange(newPagination);
    },
    muiTableContainerProps: {
      sx: { maxHeight: '600px' },
    },
    muiTableBodyRowProps: () => ({
      sx: {
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: 'action.hover',
        },
      },
    }),
  });

  return <MaterialReactTable table={table} />;
};
