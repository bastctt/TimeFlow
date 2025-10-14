import { useQuery } from '@tanstack/react-query';
import { teamsApi } from '@/services/teams';
import { queryKeys } from '@/lib/queryKeys';

export function useTeams() {
  return useQuery({
    queryKey: queryKeys.teams.all,
    queryFn: () => teamsApi.getAll(),
  });
}

export function useTeam(id: number) {
  return useQuery({
    queryKey: queryKeys.teams.detail(id),
    queryFn: () => teamsApi.getById(id),
    enabled: !!id,
  });
}

export function useTeamMembers(id: number) {
  return useQuery({
    queryKey: queryKeys.teams.members(id),
    queryFn: () => teamsApi.getMembers(id),
    enabled: !!id,
  });
}
