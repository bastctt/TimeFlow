import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';
import type { User, AuthResponse, LoginCredentials, RegisterData } from '../types/user';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = Cookies.get('token');

      if (storedToken) {
        setToken(storedToken);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

        try {
          const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`);
          setUser(response.data.user);
        } catch (error) {
          // Token invalid, clear it
          Cookies.remove('token');
          delete axios.defaults.headers.common['Authorization'];
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchUser = async () => {
    try {
      const response = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`);
      setUser(response.data.user);
    } catch (error) {
      throw new Error('Failed to fetch user data');
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/api/auth/login`,
        credentials
      );

      const { token } = response.data;

      setToken(token);
      Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user data after login
      await fetchUser();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Login failed');
      }
      throw new Error('Network error');
    }
  };

  const register = async (data: RegisterData) => {
    try {
      const response = await axios.post<AuthResponse>(
        `${API_URL}/api/auth/register`,
        data
      );

      const { token } = response.data;

      setToken(token);
      Cookies.set('token', token, { expires: 7, secure: true, sameSite: 'strict' });
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      // Fetch user data after registration
      await fetchUser();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw new Error(error.response.data.error || 'Registration failed');
      }
      throw new Error('Network error');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    Cookies.remove('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const updateUser = async (data: Partial<User>) => {
    try {
      await axios.put(`${API_URL}/api/auth/update`, data);

      // Re-fetch user data after update
      await fetchUser();
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        throw error;
      }
      throw new Error('Network error');
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user && !!token,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
