import { useQuery } from '@tanstack/react-query';
import { absencesApi } from '@/services/absences';
import { queryKeys } from '@/lib/queryKeys';
import type { Absence, AbsenceStats, PotentialAbsencesResponse } from '@/types/absence';

/**
 * Get absences for the current user
 */
export function useMyAbsences(startDate?: string, endDate?: string) {
  return useQuery<Absence[]>({
    queryKey: queryKeys.absences.my(startDate, endDate),
    queryFn: () => absencesApi.getMyAbsences(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: Absence[] | undefined) => previousData,
  });
}

/**
 * Get potential absences (days without clocks or absences)
 */
export function usePotentialAbsences(startDate?: string, endDate?: string) {
  return useQuery<PotentialAbsencesResponse>({
    queryKey: queryKeys.absences.potential(startDate, endDate),
    queryFn: () => absencesApi.getPotentialAbsences(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: PotentialAbsencesResponse | undefined) => previousData,
  });
}

/**
 * Get absence statistics
 */
export function useAbsenceStats(startDate?: string, endDate?: string) {
  return useQuery<AbsenceStats>({
    queryKey: queryKeys.absences.stats(startDate, endDate),
    queryFn: () => absencesApi.getStats(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: AbsenceStats | undefined) => previousData,
  });
}

/**
 * Get team absences (Manager only)
 */
export function useTeamAbsences(startDate?: string, endDate?: string) {
  return useQuery<Absence[]>({
    queryKey: queryKeys.absences.team(startDate, endDate),
    queryFn: () => absencesApi.getTeamAbsences(startDate, endDate),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always', // Always refetch when component mounts
    refetchOnWindowFocus: false,
    placeholderData: (previousData: Absence[] | undefined) => previousData,
  });
}
