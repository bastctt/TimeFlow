import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { ClockModel } from '../models/Clock.model';
import { generateToken } from '../middleware/auth';

jest.mock('../config/database');
jest.mock('../models/User.model', () => ({
  UserModel: {
    findById: jest.fn(),
  },
}));
jest.mock('../models/Clock.model', () => ({
  ClockModel: {
    getLastClock: jest.fn(),
    create: jest.fn(),
    findByUserId: jest.fn(),
    calculateWorkingHours: jest.fn(),
    calculateTotalHours: jest.fn(),
  },
}));

describe('Clocks Routes', () => {
  const mockEmployee = {
    id: 1,
    email: 'employee@test.com',
    first_name: 'Employee',
    last_name: 'Test',
    role: 'Employé',
    team_id: 1,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockClock = {
    id: 1,
    user_id: mockEmployee.id,
    clock_time: new Date(),
    status: 'check-in',
    created_at: new Date()
  };

  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/clocks/status', () => {
    it('should get clock status', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.getLastClock as jest.Mock).mockResolvedValue(mockClock);

      const res = await request(app)
        .get('/api/clocks/status')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('is_clocked_in');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/clocks/status');

      expect(res.status).toBe(401);
    });
  });

  describe('POST /api/clocks', () => {
    it('should clock in', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.getLastClock as jest.Mock).mockResolvedValue(null);
      (ClockModel.create as jest.Mock).mockResolvedValue(mockClock);

      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'check-in' });

      expect(res.status).toBe(201);
      expect(res.body.clock).toHaveProperty('status', 'check-in');
    });

    it('should reject duplicate check-in', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.getLastClock as jest.Mock).mockResolvedValue(mockClock);

      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'check-in' });

      expect(res.status).toBe(400);
    });

    it('should clock out', async () => {
      const checkOutClock = { ...mockClock, status: 'check-out' };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.getLastClock as jest.Mock).mockResolvedValue(mockClock);
      (ClockModel.create as jest.Mock).mockResolvedValue(checkOutClock);

      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'check-out' });

      expect(res.status).toBe(201);
      expect(res.body.clock).toHaveProperty('status', 'check-out');
    });

    it('should reject invalid status', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ status: 'invalid' });

      expect(res.status).toBe(400);
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .post('/api/clocks')
        .send({ status: 'check-in' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/clocks', () => {
    it('should get user clocks', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.findByUserId as jest.Mock).mockResolvedValue([mockClock]);
      (ClockModel.calculateWorkingHours as jest.Mock).mockReturnValue([]);
      (ClockModel.calculateTotalHours as jest.Mock).mockReturnValue(8);

      const res = await request(app)
        .get('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
      expect(Array.isArray(res.body.clocks)).toBe(true);
      expect(res.body).toHaveProperty('total_hours');
    });

    it('should filter by date range', async () => {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
      const endDate = new Date();

      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.findByUserId as jest.Mock).mockResolvedValue([mockClock]);
      (ClockModel.calculateWorkingHours as jest.Mock).mockReturnValue([]);
      (ClockModel.calculateTotalHours as jest.Mock).mockReturnValue(8);

      const res = await request(app)
        .get('/api/clocks')
        .set('Authorization', `Bearer ${employeeToken}`)
        .query({
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/clocks');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/users/:id/clocks', () => {
    it('should get clocks for self', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.findByUserId as jest.Mock).mockResolvedValue([mockClock]);
      (ClockModel.calculateWorkingHours as jest.Mock).mockReturnValue([]);
      (ClockModel.calculateTotalHours as jest.Mock).mockReturnValue(8);

      const res = await request(app)
        .get(`/api/users/${mockEmployee.id}/clocks`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('clocks');
      expect(res.body).toHaveProperty('user');
    });

    it('should reject without token', async () => {
      const res = await request(app).get(`/api/users/${mockEmployee.id}/clocks`);

      expect(res.status).toBe(401);
    });
  });
});
