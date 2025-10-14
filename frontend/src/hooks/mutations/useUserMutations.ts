import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/services/users';
import { queryKeys } from '@/lib/queryKeys';
import { toast } from 'sonner';
import type { CreateEmployeeData, UpdateEmployeeData } from '@/types/user';

export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEmployeeData) =>
      usersApi.createEmployee(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      toast.success('Employé créé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de l\'employé');
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateEmployeeData }) =>
      usersApi.updateEmployee(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.detail(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.me });
      toast.success('Utilisateur modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification de l\'utilisateur');
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) =>
      usersApi.updatePassword(data),
    onSuccess: () => {
      toast.success('Mot de passe modifié avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la modification du mot de passe');
    },
  });
}
