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
    // Optimistic update
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.users.all });
      await queryClient.cancelQueries({ queryKey: queryKeys.users.employees });

      // Snapshot previous values
      const previousUsers = queryClient.getQueryData<any[]>(queryKeys.users.all);
      const previousEmployees = queryClient.getQueryData<any[]>(queryKeys.users.employees);

      // Optimistically remove user from lists
      if (previousUsers) {
        const updatedUsers = previousUsers.filter((user: any) => user.id !== userId);
        queryClient.setQueryData(queryKeys.users.all, updatedUsers);
      }
      if (previousEmployees) {
        const updatedEmployees = previousEmployees.filter((user: any) => user.id !== userId);
        queryClient.setQueryData(queryKeys.users.employees, updatedEmployees);
      }

      return { previousUsers, previousEmployees };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.users.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.users.employees });
      queryClient.invalidateQueries({ queryKey: queryKeys.teams.all });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: (_error, _userId, context) => {
      // Rollback on error
      if (context?.previousUsers) {
        queryClient.setQueryData(queryKeys.users.all, context.previousUsers);
      }
      if (context?.previousEmployees) {
        queryClient.setQueryData(queryKeys.users.employees, context.previousEmployees);
      }
      toast.error('Erreur lors de la suppression de l\'utilisateur');
    },
  });
}

// export function useUpdatePassword() {
//   return useMutation({
//     mutationFn: (data: { currentPassword: string; newPassword: string }) =>
//       usersApi.updatePassword(data),
//     onSuccess: () => {
//       toast.success('Mot de passe modifié avec succès');
//     },
//     onError: () => {
//       toast.error('Erreur lors de la modification du mot de passe');
//     },
//   });
// }
