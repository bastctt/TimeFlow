import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { reportsApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';

// Utility function to calculate date ranges for reports
export function calculateReportDateRange(period: 'week' | 'month' | 'custom'): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date = now;

  if (period === 'week') {
    start = new Date();
    start.setDate(now.getDate() - 7);
  } else if (period === 'month') {
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  } else {
    // Last 30 days
    start = new Date();
    start.setDate(now.getDate() - 30);
  }

  return {
    startDate: start.toISOString(),
    endDate: end.toISOString()
  };
}

// Hook to load all report periods at once with useQueries
export function useAllReportPeriods() {

  // Calculate all date ranges once
  const dateRanges = useMemo(() => ({
    week: calculateReportDateRange('week'),
    month: calculateReportDateRange('month'),
    custom: calculateReportDateRange('custom'),
  }), []);

  // Load all three periods in parallel with useQueries
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.reports.team('team', dateRanges.week.startDate, dateRanges.week.endDate),
        queryFn: () => reportsApi.getTeamReport('team', dateRanges.week.startDate, dateRanges.week.endDate),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: queryKeys.reports.team('team', dateRanges.month.startDate, dateRanges.month.endDate),
        queryFn: () => reportsApi.getTeamReport('team', dateRanges.month.startDate, dateRanges.month.endDate),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
      {
        queryKey: queryKeys.reports.team('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
        queryFn: () => reportsApi.getTeamReport('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: false,
        refetchOnWindowFocus: false,
      },
    ],
  });

  // Return a map of period -> data for easy access
  return useMemo(() => ({
    week: queries[0].data,
    month: queries[1].data,
    custom: queries[2].data,
    isLoading: queries.some(q => q.isLoading),
    dateRanges,
  }), [queries, dateRanges]);
}
