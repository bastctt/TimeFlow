import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clocksApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';

export function useClockInOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => clocksApi.clockInOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.status });
      queryClient.invalidateQueries({ queryKey: queryKeys.clocks.my() });
    },
    onError: () => {
      toast.error('Erreur lors du pointage');
    },
  });
}
