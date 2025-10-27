import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { queryKeys } from '@/lib/queryKeys';
import { teamsApi } from '@/services/teams';
import { usersApi } from '@/services/users';
import { clocksApi } from '@/services/clocks';
import { reportsApi } from '@/services/clocks';
import { absencesApi } from '@/services/absences';
import { calculateReportDateRange } from './useReports';

/**
 * Hook that prefetches all critical data when user is authenticated
 * This eliminates flash on first navigation to any page
 */
export function usePrefetchData() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user) return;

    const isManager = user.role === 'Manager';
    const isEmployee = user.role === 'Employé';

    // Prefetch common data for all users
    const prefetchCommonData = async () => {
      // Prefetch clock status (used in Dashboard and ClockButton)
      await queryClient.prefetchQuery({
        queryKey: queryKeys.clocks.status,
        queryFn: () => clocksApi.getStatus(),
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch current month clocks for Dashboard
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

      await queryClient.prefetchQuery({
        queryKey: queryKeys.clocks.my(startOfMonth.toISOString(), endOfMonth.toISOString()),
        queryFn: () => clocksApi.getMyClocks(startOfMonth.toISOString(), endOfMonth.toISOString()),
        staleTime: 1000 * 60 * 5,
      });
    };

    // Prefetch Manager-specific data
    const prefetchManagerData = async () => {
      // Prefetch teams list
      await queryClient.prefetchQuery({
        queryKey: queryKeys.teams.all,
        queryFn: () => teamsApi.getAll(),
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch users list
      await queryClient.prefetchQuery({
        queryKey: queryKeys.users.all,
        queryFn: () => usersApi.getAll(),
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch employees list
      await queryClient.prefetchQuery({
        queryKey: queryKeys.users.employees,
        queryFn: () => usersApi.getEmployees(),
        staleTime: 1000 * 60 * 5,
      });

      // Prefetch reports for all periods
      const dateRanges = {
        week: calculateReportDateRange('week'),
        month: calculateReportDateRange('month'),
        custom: calculateReportDateRange('custom'),
      };
      console.log('[usePrefetchData] Prefetching reports with date ranges:', dateRanges);

      // Prefetch all report periods + team absences in parallel
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.reports.team('team', dateRanges.week.startDate, dateRanges.week.endDate),
          queryFn: () => reportsApi.getTeamReport('team', dateRanges.week.startDate, dateRanges.week.endDate),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.reports.team('team', dateRanges.month.startDate, dateRanges.month.endDate),
          queryFn: () => reportsApi.getTeamReport('team', dateRanges.month.startDate, dateRanges.month.endDate),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.reports.team('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
          queryFn: () => reportsApi.getTeamReport('team', dateRanges.custom.startDate, dateRanges.custom.endDate),
          staleTime: 1000 * 60 * 5,
        }),
        // Prefetch team absences for Planning view
        queryClient.prefetchQuery({
          queryKey: queryKeys.absences.team(dateRanges.week.startDate, dateRanges.week.endDate),
          queryFn: () => absencesApi.getTeamAbsences(dateRanges.week.startDate, dateRanges.week.endDate),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.absences.team(dateRanges.month.startDate, dateRanges.month.endDate),
          queryFn: () => absencesApi.getTeamAbsences(dateRanges.month.startDate, dateRanges.month.endDate),
          staleTime: 1000 * 60 * 5,
        }),
      ]);
    };

    // Prefetch Employee-specific Planning data
    const prefetchEmployeeData = async () => {
      // Prefetch Planning data for current week + adjacent weeks
      const getWeekRange = (date: Date): { start: string; end: string } => {
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
      };

      const currentWeek = new Date();
      const weekRanges = {
        current: getWeekRange(currentWeek),
        prev: getWeekRange(new Date(currentWeek.getTime() - 7 * 24 * 60 * 60 * 1000)),
        next: getWeekRange(new Date(currentWeek.getTime() + 7 * 24 * 60 * 60 * 1000)),
        today: getWeekRange(new Date()),
      };

      // Prefetch all weeks + absences in parallel
      await Promise.all([
        queryClient.prefetchQuery({
          queryKey: queryKeys.clocks.my(weekRanges.prev.start, weekRanges.prev.end),
          queryFn: () => clocksApi.getMyClocks(weekRanges.prev.start, weekRanges.prev.end),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.clocks.my(weekRanges.current.start, weekRanges.current.end),
          queryFn: () => clocksApi.getMyClocks(weekRanges.current.start, weekRanges.current.end),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.clocks.my(weekRanges.next.start, weekRanges.next.end),
          queryFn: () => clocksApi.getMyClocks(weekRanges.next.start, weekRanges.next.end),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.clocks.my(weekRanges.today.start, weekRanges.today.end),
          queryFn: () => clocksApi.getMyClocks(weekRanges.today.start, weekRanges.today.end),
          staleTime: 1000 * 60 * 5,
        }),
        // Prefetch my absences for Planning view
        queryClient.prefetchQuery({
          queryKey: queryKeys.absences.my(weekRanges.current.start, weekRanges.current.end),
          queryFn: () => absencesApi.getMyAbsences(weekRanges.current.start, weekRanges.current.end),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.absences.my(weekRanges.prev.start, weekRanges.prev.end),
          queryFn: () => absencesApi.getMyAbsences(weekRanges.prev.start, weekRanges.prev.end),
          staleTime: 1000 * 60 * 5,
        }),
        queryClient.prefetchQuery({
          queryKey: queryKeys.absences.my(weekRanges.next.start, weekRanges.next.end),
          queryFn: () => absencesApi.getMyAbsences(weekRanges.next.start, weekRanges.next.end),
          staleTime: 1000 * 60 * 5,
        }),
      ]);
    };

    // Execute prefetch strategy
    const prefetchAll = async () => {
      try {
        // Always prefetch common data
        await prefetchCommonData();

        // Prefetch role-specific data
        if (isManager) {
          await prefetchManagerData();
        } else if (isEmployee) {
          await prefetchEmployeeData();
        }
      } catch (error) {
        console.warn('Prefetch failed, but this is non-critical:', error);
      }
    };

    // Start prefetching immediately after login
    prefetchAll();
  }, [user, queryClient]);
}
