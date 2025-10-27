import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authApi } from './auth';
import api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('Auth API Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('login', () => {
    it('calls API with correct credentials and stores token', async () => {
      const mockResponse = {
        data: {
          token: 'test-token-123',
          user: {
            id: 1,
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: 'Manager',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password123' };
      const result = await authApi.login(credentials);

      expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('test-token-123');
    });

    it('does not store token if not provided', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'Manager' },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      await authApi.login({ email: 'test@example.com', password: 'password123' });

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('register', () => {
    it('calls API with registration data and stores token', async () => {
      const mockResponse = {
        data: {
          token: 'new-token-456',
          user: {
            id: 2,
            email: 'newuser@example.com',
            first_name: 'New',
            last_name: 'User',
            role: 'Employé',
          },
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const registerData = {
        username: 'newuser',
        email: 'newuser@example.com',
        password: 'password123',
      };
      const result = await authApi.register(registerData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', registerData);
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('new-token-456');
    });
  });

  describe('logout', () => {
    it('removes token from localStorage', async () => {
      localStorage.setItem('token', 'test-token');

      await authApi.logout();

      expect(localStorage.getItem('token')).toBeNull();
    });
  });

  describe('me', () => {
    it('fetches current user data', async () => {
      const mockResponse = {
        data: {
          id: 1,
          email: 'test@example.com',
          first_name: 'Test',
          last_name: 'User',
          role: 'Manager',
        },
      };

      vi.mocked(api.get).mockResolvedValue(mockResponse);

      const result = await authApi.me();

      expect(api.get).toHaveBeenCalledWith('/auth/me');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('requestPasswordReset', () => {
    it('sends password reset request with email', async () => {
      const mockResponse = {
        data: {
          message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.requestPasswordReset('test@example.com');

      expect(api.post).toHaveBeenCalledWith('/auth/request-reset', { email: 'test@example.com' });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('verifyResetToken', () => {
    it('verifies reset token validity', async () => {
      const mockResponse = {
        data: {
          valid: true,
          email: 'test@example.com',
          first_name: 'Test',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.verifyResetToken('test-token-123');

      expect(api.post).toHaveBeenCalledWith('/auth/verify-reset-token', { token: 'test-token-123' });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('resetPassword', () => {
    it('resets password with token and stores new token', async () => {
      const mockResponse = {
        data: {
          message: 'Mot de passe réinitialisé avec succès',
          token: 'new-auth-token',
        },
      };

      vi.mocked(api.post).mockResolvedValue(mockResponse);

      const result = await authApi.resetPassword('reset-token-123', 'newpassword');

      expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
        token: 'reset-token-123',
        password: 'newpassword',
      });
      expect(result).toEqual(mockResponse.data);
      expect(localStorage.getItem('token')).toBe('new-auth-token');
    });
  });
});
