import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';

export function useTeamReport(type: string, startDate: string, endDate: string) {
  return useQuery({
    queryKey: queryKeys.reports.team(type, startDate, endDate),
    queryFn: () => reportsApi.getTeamReport(type, startDate, endDate),
    enabled: !!startDate && !!endDate,
    placeholderData: (previousData) => previousData,
    staleTime: 0, // Always fetch fresh data when period changes
  });
}
