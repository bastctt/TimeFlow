import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import { ClockModel } from '../models/Clock.model';
import { generateToken } from '../middleware/auth';
import type { User } from '../types/user';

jest.mock('../config/database', () => ({
  default: {},
}));
jest.mock('../models/User.model', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findAll: jest.fn(),
    findByRole: jest.fn(),
    verifyPassword: jest.fn(),
    toResponse: jest.fn(),
  },
}));
jest.mock('../models/Team.model', () => ({
  TeamModel: {
    findByManagerId: jest.fn(),
  },
}));
jest.mock('../models/Clock.model', () => ({
  ClockModel: {
    findByUserId: jest.fn(),
    calculateWorkingHours: jest.fn(),
    calculateTotalHours: jest.fn(),
  },
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTeamModel = TeamModel as jest.Mocked<typeof TeamModel>;
const mockClockModel = ClockModel as jest.Mocked<typeof ClockModel>;

describe('Users Routes', () => {
  const mockManager: User = {
    id: 1,
    email: 'manager@test.com',
    password_hash: 'hashed_password',
    first_name: 'Manager',
    last_name: 'Test',
    role: 'Manager' as const,
    team_id: 1
  };

  const mockEmployee: User = {
    id: 2,
    email: 'employee@test.com',
    password_hash: 'hashed_password',
    first_name: 'Employee',
    last_name: 'Test',
    role: 'Employé' as const,
    team_id: 1
  };

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should get all users as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockUserModel.findAll.mockResolvedValue([mockManager, mockEmployee]);
      mockUserModel.toResponse.mockImplementation((user) => user);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should reject employee access', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/users');

      expect(res.status).toBe(401);
    });
  });


  describe('PUT /api/users/:id', () => {
    it('should update own profile', async () => {
      const updatedUser = { ...mockEmployee, first_name: 'Updated' };

      mockUserModel.findById.mockResolvedValue(mockEmployee);
      mockUserModel.update.mockResolvedValue(updatedUser);
      mockUserModel.toResponse.mockImplementation((user) => user);

      const res = await request(app)
        .put(`/api/users/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ first_name: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should reject updating other users as employee', async () => {
      const otherEmployee = { ...mockEmployee, id: 99 };

      mockUserModel.findById
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(otherEmployee);

      const res = await request(app)
        .put(`/api/users/${otherEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ first_name: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete own account as employee', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);
      mockUserModel.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/users/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
    });

    it('should delete own account as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockUserModel.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/users/${mockManager.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 when delete fails', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);
      mockUserModel.delete.mockResolvedValue(false);

      const res = await request(app)
        .delete(`/api/users/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/users/employees', () => {
    const mockTeam = {
      id: 1,
      name: 'Test Team',
      manager_id: mockManager.id,
      created_at: new Date(),
      updated_at: new Date(),
      description: 'A team for testing'
    };

    it('should get employees as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([mockTeam]);
      mockUserModel.findByRole.mockResolvedValue([mockEmployee]);
      mockUserModel.toResponse.mockImplementation((user) => user);

      const res = await request(app)
        .get('/api/users/employees')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should return empty array for manager with no team', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([]);

      const res = await request(app)
        .get('/api/users/employees')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body.users).toEqual([]);
    });

    it('should reject employee access', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/users/employees')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/users/:id/clocks', () => {
    const mockClock = {
      id: 1,
      user_id: mockEmployee.id,
      clock_time: new Date(),
      status: 'check-in' as const,
      created_at: new Date()
    };

    it('should get own clocks', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);
      mockClockModel.findByUserId.mockResolvedValue([mockClock]);
      mockClockModel.calculateWorkingHours.mockReturnValue([]);
      mockClockModel.calculateTotalHours.mockReturnValue(8);
      mockUserModel.toResponse.mockImplementation((user) => user);

      const res = await request(app)
        .get(`/api/users/${mockEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
      expect(res.body).toHaveProperty('user');
    });

    it('should get employee clocks as manager from same team', async () => {
      mockUserModel.findById
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockManager);
      mockClockModel.findByUserId.mockResolvedValue([mockClock]);
      mockClockModel.calculateWorkingHours.mockReturnValue([]);
      mockClockModel.calculateTotalHours.mockReturnValue(8);
      mockUserModel.toResponse.mockImplementation((user) => user);

      const res = await request(app)
        .get(`/api/users/${mockEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
    });

    it('should reject accessing other employee clocks', async () => {
      const otherEmployee = { ...mockEmployee, id: 99, team_id: 2 };

      mockUserModel.findById
        .mockResolvedValueOnce(otherEmployee)
        .mockResolvedValueOnce(mockEmployee);

      const res = await request(app)
        .get(`/api/users/${otherEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject without token', async () => {
      const res = await request(app).get(`/api/users/${mockEmployee.id}/clocks`);

      expect(res.status).toBe(401);
    });
  });
});
