import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import { ClockModel } from '../models/Clock.model';
import { generateToken } from '../middleware/auth';

jest.mock('../config/database');
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

describe('Users Routes', () => {
  const mockManager = {
    id: 1,
    email: 'manager@test.com',
    first_name: 'Manager',
    last_name: 'Test',
    role: 'Manager',
    team_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockEmployee = {
    id: 2,
    email: 'employee@test.com',
    first_name: 'Employee',
    last_name: 'Test',
    role: 'Employé',
    team_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('should get all users as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (UserModel.findAll as jest.Mock).mockResolvedValue([mockManager, mockEmployee]);
      (UserModel.toResponse as jest.Mock).mockImplementation((user) => user);

      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should reject employee access', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

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

      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (UserModel.update as jest.Mock).mockResolvedValue(updatedUser);
      (UserModel.toResponse as jest.Mock).mockImplementation((user) => user);

      const res = await request(app)
        .put(`/api/users/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ first_name: 'Updated' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
    });

    it('should reject updating other users as employee', async () => {
      const otherEmployee = { ...mockEmployee, id: 99 };

      (UserModel.findById as jest.Mock)
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
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (UserModel.delete as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/users/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
    });

    it('should delete own account as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (UserModel.delete as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/users/${mockManager.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });

    it('should return 404 when delete fails', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (UserModel.delete as jest.Mock).mockResolvedValue(false);

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
      manager_id: mockManager.id
    };

    it('should get employees as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([mockTeam]);
      (UserModel.findByRole as jest.Mock).mockResolvedValue([mockEmployee]);
      (UserModel.toResponse as jest.Mock).mockImplementation((user) => user);

      const res = await request(app)
        .get('/api/users/employees')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(Array.isArray(res.body.users)).toBe(true);
    });

    it('should return empty array for manager with no team', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/users/employees')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('users');
      expect(res.body.users).toEqual([]);
    });

    it('should reject employee access', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

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
      status: 'check-in',
      created_at: new Date()
    };

    it('should get own clocks', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.findByUserId as jest.Mock).mockResolvedValue([mockClock]);
      (ClockModel.calculateWorkingHours as jest.Mock).mockReturnValue([]);
      (ClockModel.calculateTotalHours as jest.Mock).mockReturnValue(8);
      (UserModel.toResponse as jest.Mock).mockImplementation((user) => user);

      const res = await request(app)
        .get(`/api/users/${mockEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
      expect(res.body).toHaveProperty('user');
    });

    it('should get employee clocks as manager from same team', async () => {
      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockManager);
      (ClockModel.findByUserId as jest.Mock).mockResolvedValue([mockClock]);
      (ClockModel.calculateWorkingHours as jest.Mock).mockReturnValue([]);
      (ClockModel.calculateTotalHours as jest.Mock).mockReturnValue(8);
      (UserModel.toResponse as jest.Mock).mockImplementation((user) => user);

      const res = await request(app)
        .get(`/api/users/${mockEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
    });

    it('should reject accessing other employee clocks', async () => {
      const otherEmployee = { ...mockEmployee, id: 99, team_id: 2 };

      (UserModel.findById as jest.Mock)
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
