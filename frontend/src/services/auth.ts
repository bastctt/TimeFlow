import api from '@/lib/api';
import type { User } from '../types/user';

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', credentials);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  register: async (registerData: RegisterData): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', registerData);
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('token');
  },

  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me');
    return data;
  },

  updateProfile: async (updates: Partial<User>): Promise<User> => {
    const { data } = await api.put<{ user: User }>('/auth/update', updates);
    return data.user;
  },

  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    const { data } = await api.post<{ message: string }>('/auth/request-reset', { email });
    return data;
  },

  verifyResetToken: async (token: string): Promise<{ valid: boolean; email: string; first_name: string }> => {
    const { data } = await api.post<{ valid: boolean; email: string; first_name: string }>('/auth/verify-reset-token', { token });
    return data;
  },

  resetPassword: async (token: string, password: string): Promise<{ message: string; token: string }> => {
    const { data } = await api.post<{ message: string; token: string }>('/auth/reset-password', { token, password });
    if (data.token) {
      localStorage.setItem('token', data.token);
    }
    return data;
  },
};
