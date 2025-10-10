import axios from 'axios';
import type { User, CreateEmployeeData, UpdateEmployeeData } from '../types/user';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export const usersApi = {
  // Get all users (Manager only)
  getAll: async (): Promise<User[]> => {
    const response = await axios.get<{ users: User[] }>(`${API_URL}/api/users`);
    return response.data.users;
  },

  // Get all employees (Manager only)
  getEmployees: async (): Promise<User[]> => {
    const response = await axios.get<{ users: User[] }>(`${API_URL}/api/users/employees`);
    return response.data.users;
  },

  // Create employee (Manager only)
  createEmployee: async (data: CreateEmployeeData): Promise<User> => {
    const response = await axios.post<{ user: User }>(`${API_URL}/api/users`, data);
    return response.data.user;
  },

  // Update employee (Manager only)
  updateEmployee: async (id: number, data: UpdateEmployeeData): Promise<User> => {
    const response = await axios.put<{ user: User }>(`${API_URL}/api/users/${id}`, data);
    return response.data.user;
  },

  // Delete user (Manager can delete employees, anyone can delete their own account)
  deleteUser: async (id: number): Promise<void> => {
    await axios.delete(`${API_URL}/api/users/${id}`);
  }
};
