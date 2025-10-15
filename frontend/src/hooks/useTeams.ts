import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/services/teams';
import { queryKeys } from '@/lib/queryKeys';

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => teamsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
    refetchOnMount: false, // Don't refetch if data is fresh
    refetchOnWindowFocus: false, // Don't refetch on window focus
    placeholderData: [], // Show empty array instead of undefined to prevent flash
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: queryKeys.teams.detail(id),
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useTeamMembers(id: number) {
  return useQuery({
    queryKey: queryKeys.teams.members(id),
    queryFn: () => teamsApi.getMembers(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: [], // Show empty array instead of undefined to prevent flash
  });
}
