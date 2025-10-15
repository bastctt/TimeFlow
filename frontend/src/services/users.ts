import api from '@/lib/api';
import type { User, CreateEmployeeData, UpdateEmployeeData } from '../types/user';

export const usersApi = {
  // Get all users (Manager only)
  getAll: async (): Promise<User[]> => {
    const { data } = await api.get<{ users: User[] }>('/users');
    return data.users;
  },

  // Get user by ID
  getById: async (id: number): Promise<User> => {
    const { data } = await api.get<{ user: User }>(`/users/${id}`);
    return data.user;
  },

  // Get all employees (Manager only)
  getEmployees: async (): Promise<User[]> => {
    const { data } = await api.get<{ users: User[] }>('/users/employees');
    return data.users;
  },

  // Create employee (Manager only)
  createEmployee: async (data: CreateEmployeeData): Promise<User> => {
    const { data: response } = await api.post<{ user: User }>('/users', data);
    return response.user;
  },

  // Update employee (Manager only)
  updateEmployee: async (id: number, data: UpdateEmployeeData): Promise<User> => {
    const { data: response } = await api.put<{ user: User }>(`/users/${id}`, data);
    return response.user;
  },

  // Update password
  updatePassword: async (oldPassword: string, newPassword: string): Promise<void> => {
    await api.put('/auth/update', { oldPassword, newPassword });
  },

  // Delete user (Manager can delete employees, anyone can delete their own account)
  delete: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  deleteUser: async (id: number): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  // Get user clocks
  getUserClocks: async (userId: number, startDate?: string, endDate?: string): Promise<any> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);

    const { data } = await api.get(`/users/${userId}/clocks?${params.toString()}`);
    return data;
  },
};
