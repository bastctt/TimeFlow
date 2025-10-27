import { useMutation, useQueryClient } from '@tanstack/react-query';
import { absencesApi } from '@/services/absences';
import { queryKeys } from '../useAbsences';
import { toast } from 'sonner';
import type { AbsenceCreate, AbsenceUpdate } from '@/types/absence';

/**
 * Create a new absence
 */
export function useCreateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AbsenceCreate) => absencesApi.create(data),
    onSuccess: async () => {
      // Invalidate all absence-related queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['absences'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['clocks'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      ]);

      toast.success('Absence enregistrée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de l'enregistrement de l'absence");
    },
  });
}

/**
 * Update an absence
 */
export function useUpdateAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: AbsenceUpdate }) =>
      absencesApi.update(id, data),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['absences'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      ]);

      toast.success('Absence mise à jour avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de la mise à jour de l'absence");
    },
  });
}

/**
 * Delete an absence
 */
export function useDeleteAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => absencesApi.delete(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['absences'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['clocks'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['users'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      ]);

      toast.success('Absence supprimée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'absence");
    },
  });
}

/**
 * Approve an absence (Manager only)
 */
export function useApproveAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => absencesApi.approve(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['absences'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      ]);

      toast.success('Absence approuvée avec succès');
    },
    onError: () => {
      toast.error("Erreur lors de l'approbation de l'absence");
    },
  });
}

/**
 * Reject an absence (Manager only)
 */
export function useRejectAbsence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => absencesApi.reject(id),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['absences'], refetchType: 'all' }),
        queryClient.invalidateQueries({ queryKey: ['reports'], refetchType: 'all' }),
      ]);

      toast.success('Absence refusée');
    },
    onError: () => {
      toast.error("Erreur lors du refus de l'absence");
    },
  });
}
