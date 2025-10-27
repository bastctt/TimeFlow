import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { reportsApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';
import type { TeamReport } from '@/types/clock';

// Utility function to calculate date ranges for reports
export function calculateReportDateRange(period: 'week' | 'month' | 'custom'): { startDate: string; endDate: string } {
  const now = new Date();
  let start: Date;
  let end: Date;

  if (period === 'week') {
    // Last 7 days from today
    start = new Date(now);
    start.setDate(now.getDate() - 7);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  } else if (period === 'month') {
    // Current month
    start = new Date(now.getFullYear(), now.getMonth(), 1);
    start.setHours(0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    end.setHours(23, 59, 59, 999);
  } else {
    // Last 30 days
    start = new Date(now);
    start.setDate(now.getDate() - 30);
    start.setHours(0, 0, 0, 0);
    end = new Date(now);
    end.setHours(23, 59, 59, 999);
  }

  // Format as YYYY-MM-DD to ensure consistent query keys
  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  return {
    startDate: formatDate(start),
    endDate: formatDate(end)
  };
}

// Hook to load all report periods at once with useQueries
export function useAllReportPeriods() {
  // Calculate all date ranges once
  const dateRanges = useMemo(() => {
    const ranges = {
      week: calculateReportDateRange('week'),
      month: calculateReportDateRange('month'),
      custom: calculateReportDateRange('custom'),
    };
    console.log('[useReports] Date ranges:', ranges);
    return ranges;
  }, []);

  // Load all three periods in parallel with useQueries
  const queries = useQueries({
    queries: [
      {
        queryKey: queryKeys.reports.team('team', dateRanges.week.startDate, dateRanges.week.endDate),
        queryFn: (): Promise<TeamReport> => reportsApi.getTeamReport('team', dateRanges.week.startDate, dateRanges.week.endDate),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        refetchOnWindowFocus: false,
        placeholderData: (previousData: TeamReport | undefined) => previousData,
      },
      {
        queryKey: queryKeys.reports.team('team', dateRanges.month.startDate, dateRanges.month.endDate),
        queryFn: (): Promise<TeamReport> => reportsApi.getTeamReport('team', dateRanges.month.startDate, dateRanges.month.endDate),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: TeamReport | undefined) => previousData,
      },
      {
        queryKey: queryKeys.reports.team('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
        queryFn: (): Promise<TeamReport> => reportsApi.getTeamReport('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: TeamReport | undefined) => previousData,
      },
    ],
  });

  // Return a map of period -> data for easy access
  return useMemo(() => {
    const result = {
      week: queries[0].data,
      month: queries[1].data,
      custom: queries[2].data,
      isLoading: queries.some(q => q.isLoading),
      dateRanges,
    };
    console.log('[useReports] Queries state:', {
      weekLoading: queries[0].isLoading,
      weekData: !!queries[0].data,
      weekStatus: queries[0].status,
      monthLoading: queries[1].isLoading,
      monthData: !!queries[1].data,
      customLoading: queries[2].isLoading,
      customData: !!queries[2].data,
    });
    return result;
  }, [queries, dateRanges]);
}
