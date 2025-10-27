import { useQuery, useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { clocksApi } from '@/services/clocks';
import { queryKeys } from '@/lib/queryKeys';
import type { UserClocks, ClockIssues, ClockStatus } from '@/types/clock';

export function useClockStatus() {
  return useQuery<ClockStatus>({
    queryKey: queryKeys.clocks.status,
    queryFn: () => clocksApi.getStatus(),
    staleTime: 1000 * 30, // 30 seconds
    gcTime: 1000 * 60 * 10, // Keep in cache for 10 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: ClockStatus | undefined) => previousData,
  });
}

// Hook for fetching user's clocks for a specific date range (used in Dashboard)
export function useMyClocks(startDate: string, endDate: string) {
  return useQuery<UserClocks>({
    queryKey: queryKeys.clocks.my(startDate, endDate),
    queryFn: () => clocksApi.getMyClocks(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnMount: 'always', // Always refetch but show cached data first
    refetchOnWindowFocus: false,
    placeholderData: (previousData: UserClocks | undefined) => previousData, // Keep previous data while refetching
  });
}

// Helper to calculate week start/end dates
function getWeekRange(date: Date): { start: string; end: string } {
  const start = new Date(date);
  const day = start.getDay();
  const diff = start.getDate() - day + (day === 0 ? -6 : 1);
  start.setDate(diff);
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  return {
    start: start.toISOString(),
    end: end.toISOString()
  };
}

// Main hook: load current week + adjacent weeks in parallel with useQueries
export function usePlanningClocks(currentWeek: Date, isEmployee: boolean) {
  // Calculate 3 weeks: previous, current, next
  const weekRanges = useMemo(() => {
    const current = getWeekRange(currentWeek);

    const prevDate = new Date(currentWeek);
    prevDate.setDate(currentWeek.getDate() - 7);
    const prev = getWeekRange(prevDate);

    const nextDate = new Date(currentWeek);
    nextDate.setDate(currentWeek.getDate() + 7);
    const next = getWeekRange(nextDate);

    // Also calculate today's week
    const today = getWeekRange(new Date());

    return { prev, current, next, today };
  }, [currentWeek]);

  // Load all weeks in parallel
  const clockQueries = useQueries({
    queries: [
      {
        queryKey: queryKeys.clocks.my(weekRanges.prev.start, weekRanges.prev.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getMyClocks(weekRanges.prev.start, weekRanges.prev.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isEmployee,
      },
      {
        queryKey: queryKeys.clocks.my(weekRanges.current.start, weekRanges.current.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getMyClocks(weekRanges.current.start, weekRanges.current.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isEmployee,
      },
      {
        queryKey: queryKeys.clocks.my(weekRanges.next.start, weekRanges.next.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getMyClocks(weekRanges.next.start, weekRanges.next.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isEmployee,
      },
      {
        queryKey: queryKeys.clocks.my(weekRanges.today.start, weekRanges.today.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getMyClocks(weekRanges.today.start, weekRanges.today.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isEmployee,
      },
    ],
  });

  return useMemo(() => {
    const data = clockQueries[1].data || { total_hours: 0, working_hours: [] };
    const isLoading = clockQueries.some(q => q.isLoading);

    return {
      data,
      isLoading,
      weekRanges,
    };
  }, [clockQueries, weekRanges]);
}

// Hook for team clocks (manager view)
export function useTeamPlanningClocks(
  members: Array<{ id: number }>,
  currentWeek: Date,
  isManager: boolean
) {
  const weekRanges = useMemo(() => {
    const current = getWeekRange(currentWeek);

    const prevDate = new Date(currentWeek);
    prevDate.setDate(currentWeek.getDate() - 7);
    const prev = getWeekRange(prevDate);

    const nextDate = new Date(currentWeek);
    nextDate.setDate(currentWeek.getDate() + 7);
    const next = getWeekRange(nextDate);

    const today = getWeekRange(new Date());

    return { prev, current, next, today };
  }, [currentWeek]);

  // Load clocks for all members for all weeks in parallel
  const teamQueries = useQueries({
    queries: members.flatMap(member => [
      {
        queryKey: queryKeys.users.clocks(member.id, weekRanges.prev.start, weekRanges.prev.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getUserClocks(member.id, weekRanges.prev.start, weekRanges.prev.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isManager && members.length > 0,
      },
      {
        queryKey: queryKeys.users.clocks(member.id, weekRanges.current.start, weekRanges.current.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getUserClocks(member.id, weekRanges.current.start, weekRanges.current.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isManager && members.length > 0,
      },
      {
        queryKey: queryKeys.users.clocks(member.id, weekRanges.next.start, weekRanges.next.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getUserClocks(member.id, weekRanges.next.start, weekRanges.next.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isManager && members.length > 0,
      },
      {
        queryKey: queryKeys.users.clocks(member.id, weekRanges.today.start, weekRanges.today.end),
        queryFn: (): Promise<UserClocks> => clocksApi.getUserClocks(member.id, weekRanges.today.start, weekRanges.today.end),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        refetchOnMount: 'always' as const,
        refetchOnWindowFocus: false,
        placeholderData: (previousData: UserClocks | undefined) => previousData,
        enabled: isManager && members.length > 0,
      },
    ]),
  });

  return useMemo(() => {
    const clockData: { [userId: number]: UserClocks } = {};
    members.forEach((member, index) => {
      // Get current week data (index * 4 + 1)
      const currentWeekQuery = teamQueries[index * 4 + 1];
      if (currentWeekQuery?.data) {
        clockData[member.id] = currentWeekQuery.data;
      }
    });

    const isLoading = teamQueries.some(q => q.isLoading);

    return {
      clockData,
      isLoading,
      weekRanges,
    };
  }, [teamQueries, members, weekRanges]);
}

// Hook to detect clock issues (missing checkouts and absent days)
export function useClockIssues(startDate?: string, endDate?: string) {
  return useQuery<ClockIssues>({
    queryKey: queryKeys.clocks.issues(startDate, endDate),
    queryFn: () => clocksApi.detectIssues(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // Keep in cache for 30 minutes
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: ClockIssues | undefined) => previousData,
  });
}
