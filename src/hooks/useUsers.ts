import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchUsers, updateUserStatus } from '@/api';
import type { PaginationParams, UsersApiResponse } from '@/types';

// Query keys
export const userQueryKeys = {
  all: ['users'] as const,
  list: (params: PaginationParams) => ['users', 'list', params] as const,
};

/**
 * Hook to fetch users with pagination and filters
 */
export const useUsers = (params: PaginationParams) => {
  return useQuery({
    queryKey: userQueryKeys.list(params),
    queryFn: () => fetchUsers(params),
  });
};

/**
 * Hook to update user status with optimistic updates
 *
 * Immediately updates the UI when status is toggled, then syncs with server.
 * If the API call fails, reverts to the original status.
 */
export const useUpdateUserStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }: { userId: string; status: 'active' | 'inactive' }) =>
      updateUserStatus(userId, status),

    onMutate: async ({ userId, status }) => {
      // Cancel any outgoing refetches to prevent overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: userQueryKeys.all });

      // Snapshot all current user queries for potential rollback
      const previousQueries = queryClient.getQueriesData<UsersApiResponse>({
        queryKey: userQueryKeys.all,
      });

      // Optimistically update all user queries in the cache
      queryClient.setQueriesData<UsersApiResponse>(
        { queryKey: userQueryKeys.all },
        (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            data: {
              ...oldData.data,
              users: oldData.data.users.map((user) =>
                user.userId === userId ? { ...user, status } : user
              ),
            },
          };
        }
      );

      // Return snapshot for rollback on error
      return { previousQueries };
    },

    onError: (_error, _variables, context) => {
      // Rollback to previous state on error
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
    },

    onSettled: () => {
      // Refetch to ensure cache is in sync with server
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
    },
  });
};

/**
 * Hook to manually invalidate users cache
 */
export const useInvalidateUsersCache = () => {
  const queryClient = useQueryClient();

  return {
    invalidateAll: () =>
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all }),
  };
};
