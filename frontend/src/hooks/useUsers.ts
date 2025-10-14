import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/services/users';
import { queryKeys } from '@/lib/queryKeys';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersApi.getAll(),
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.users.employees,
    queryFn: () => usersApi.getEmployees(),
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useUserClocks(id: number, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.users.clocks(id, startDate, endDate),
    queryFn: () => usersApi.getUserClocks(id, startDate, endDate),
    enabled: !!id,
  });
}
