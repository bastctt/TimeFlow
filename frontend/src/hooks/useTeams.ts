import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/services/teams';
import { queryKeys } from '@/lib/queryKeys';
import type { Team, TeamMember } from '@/types/team';

export function useTeams() {
  return useQuery<Team[]>({
    queryKey: queryKeys.teams.all,
    queryFn: () => teamsApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes - data stays fresh
    gcTime: 1000 * 60 * 30, // 30 minutes - keep in cache
    refetchOnMount: 'always', // Refetch in background but show cached data
    refetchOnWindowFocus: false, // Don't refetch on window focus
    placeholderData: (previousData: Team[] | undefined) => previousData, // Keep previous data while refetching
  });
}

export function useTeam(id: number) {
  return useQuery<Team>({
    queryKey: queryKeys.teams.detail(id),
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: Team | undefined) => previousData,
  });
}

export function useTeamMembers(id: number) {
  return useQuery<TeamMember[]>({
    queryKey: queryKeys.teams.members(id),
    queryFn: () => teamsApi.getMembers(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: 'always',
    refetchOnWindowFocus: false,
    placeholderData: (previousData: TeamMember[] | undefined) => previousData, // Keep previous data while refetching
  });
}
