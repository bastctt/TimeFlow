import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clocksApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import type { ClockIn, ClockStatus, Clock } from '@/types/clock';

export function useClockInOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ClockIn) => clocksApi.clockIn(data),
    // Optimistic update: update cache immediately before server response
    onMutate: async (variables: ClockIn) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await queryClient.cancelQueries({ queryKey: queryKeys.clocks.status });

      // Snapshot current status
      const previousStatus = queryClient.getQueryData<ClockStatus>(queryKeys.clocks.status);

      // Optimistically update status
      if (previousStatus) {
        const now = new Date().toISOString();
        const newClock: Clock = {
          id: Date.now(), // Temporary ID
          user_id: previousStatus.last_clock?.user_id || 0,
          clock_time: now,
          status: variables.status,
          created_at: now,
        };

        queryClient.setQueryData<ClockStatus>(queryKeys.clocks.status, {
          is_clocked_in: variables.status === 'check-in',
          last_clock: newClock,
        });
      }

      return { previousStatus };
    },
    onSuccess: () => {
      // Invalidate all clock-related queries to refetch from server
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.my() });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
    },
    onError: (_error, _variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousStatus) {
        queryClient.setQueryData(queryKeys.clocks.status, context.previousStatus);
      }
      toast.error('Erreur lors du pointage');
    },
  });
}
