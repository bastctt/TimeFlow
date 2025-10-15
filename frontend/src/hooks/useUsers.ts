import { useQuery } from '@tanstack/react-query';
import { usersApi } from '@/services/users';
import { queryKeys } from '@/lib/queryKeys';

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users.all,
    queryFn: () => usersApi.getAll(),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30, // 30 minutes
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: [], // Prevent flash with empty array
  });
}

export function useEmployees() {
  return useQuery({
    queryKey: queryKeys.users.employees,
    queryFn: () => usersApi.getEmployees(),
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    placeholderData: [], // Prevent flash with empty array
  });
}

export function useUser(id: number) {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}

export function useUserClocks(id: number, startDate?: string, endDate?: string) {
  return useQuery({
    queryKey: queryKeys.users.clocks(id, startDate, endDate),
    queryFn: () => usersApi.getUserClocks(id, startDate, endDate),
    enabled: !!id && !!startDate && !!endDate,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 30,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
  });
}
