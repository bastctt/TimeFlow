import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamsApi } from '@/services/teams';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import type { TeamCreate, TeamUpdate } from '@/types/team';

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TeamCreate) =>
      teamsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Équipe créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'équipe');
    },
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: TeamUpdate }) =>
      teamsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.detail(variables.id) });
      toast.success('Équipe modifiée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de l\'équipe');
    },
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => teamsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Équipe supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de l\'équipe');
    },
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      teamsApi.addMember(teamId, userId),
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.members(variables.teamId) });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData(queryKeys.teams.members(variables.teamId));

      // Optimistically update - add user to members list immediately
      // Note: We can't add full user data without fetching, so we invalidate instead
      // But we prevent flash by not showing loading state

      return { previousMembers };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Membre ajouté avec succès');
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKeys.teams.members(variables.teamId), context.previousMembers);
      }
      toast.error('Erreur lors de l\'ajout du membre');
    },
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: { teamId: number; userId: number }) =>
      teamsApi.removeMember(teamId, userId),
    // Optimistic update
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.teams.members(variables.teamId) });

      // Snapshot previous value
      const previousMembers = queryClient.getQueryData<any[]>(queryKeys.teams.members(variables.teamId));

      // Optimistically remove member from list
      if (previousMembers) {
        const updatedMembers = previousMembers.filter((member: any) => member.id !== variables.userId);
        queryClient.setQueryData(queryKeys.teams.members(variables.teamId), updatedMembers);
      }

      return { previousMembers };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.members(variables.teamId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Membre retiré avec succès');
    },
    onError: (_error, variables, context) => {
      // Rollback on error
      if (context?.previousMembers) {
        queryClient.setQueryData(queryKeys.teams.members(variables.teamId), context.previousMembers);
      }
      toast.error('Erreur lors du retrait du membre');
    },
  });
}
