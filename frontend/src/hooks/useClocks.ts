import { useQuery } from '@tanstack/react-query';
import { clocksApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';

export function useClockStatus() {
  return useQuery({
    queryKey: queryKeys.clocks.status,
    queryFn: () => clocksApi.getStatus(),
  });
}

export function useMyClocks(startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.clocks.my(startDate, endDate),
    queryFn: () => clocksApi.getMyClocks(startDate, endDate),
  });
}

export function useUserClocks(userId: number, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.users.clocks(userId, startDate, endDate),
    queryFn: () => clocksApi.getUserClocks(userId, startDate, endDate),
    enabled: !!userId,
  });
}
