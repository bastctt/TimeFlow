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
    findById: jest.fn(),
  },
}));
jest.mock('../models/Team.model', () => ({
  TeamModel: {
    findByManagerId: jest.fn(),
    findById: jest.fn(),
    getMembers: jest.fn(),
  },
}));
jest.mock('../models/Clock.model', () => ({
  ClockModel: {
    getDailyReports: jest.fn(),
    getWeeklyReports: jest.fn(),
    getAdvancedKPIs: jest.fn(),
  },
}));

describe('Reports Routes', () => {
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

  const mockTeam = {
    id: 1,
    name: 'Test Team',
    description: 'Test Description',
    manager_id: mockManager.id,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockDailyReport = {
    user_id: mockEmployee.id,
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8,
    first_name: 'Employee',
    last_name: 'Test'
  };

  const mockWeeklyReport = {
    user_id: mockEmployee.id,
    week_start: new Date().toISOString().split('T')[0],
    week_end: new Date().toISOString().split('T')[0],
    total_hours: 40,
    days_worked: 5,
    first_name: 'Employee',
    last_name: 'Test'
  };

  const mockKPIs = {
    total_hours: 40,
    average_daily_hours: 8,
    days_worked: 5
  };

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('should get team report as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([mockTeam]);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.getMembers as jest.Mock).mockResolvedValue([mockEmployee]);
      (ClockModel.getDailyReports as jest.Mock).mockResolvedValue([mockDailyReport]);
      (ClockModel.getWeeklyReports as jest.Mock).mockResolvedValue([mockWeeklyReport]);
      (ClockModel.getAdvancedKPIs as jest.Mock).mockResolvedValue(mockKPIs);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ type: 'team' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('team_id');
      expect(res.body).toHaveProperty('daily_reports');
      expect(res.body).toHaveProperty('weekly_reports');
    });

    it('should get daily reports as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([mockTeam]);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.getMembers as jest.Mock).mockResolvedValue([mockEmployee]);
      (ClockModel.getDailyReports as jest.Mock).mockResolvedValue([mockDailyReport]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ type: 'daily' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(res.body).toHaveProperty('summary');
      expect(res.body.type).toBe('daily');
    });

    it('should get weekly reports as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([mockTeam]);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.getMembers as jest.Mock).mockResolvedValue([mockEmployee]);
      (ClockModel.getWeeklyReports as jest.Mock).mockResolvedValue([mockWeeklyReport]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ type: 'weekly' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(res.body.type).toBe('weekly');
    });

    it('should reject employee access', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject manager without team', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(400);
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/reports');

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/reports/employee/:id', () => {
    it('should get own employee report', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);
      (ClockModel.getDailyReports as jest.Mock).mockResolvedValue([mockDailyReport]);
      (ClockModel.getWeeklyReports as jest.Mock).mockResolvedValue([mockWeeklyReport]);

      const res = await request(app)
        .get(`/api/reports/employee/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('employee');
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('daily_reports');
      expect(res.body).toHaveProperty('weekly_reports');
    });

    it('should get employee report as manager from same team', async () => {
      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockManager);
      (ClockModel.getDailyReports as jest.Mock).mockResolvedValue([mockDailyReport]);
      (ClockModel.getWeeklyReports as jest.Mock).mockResolvedValue([mockWeeklyReport]);

      const res = await request(app)
        .get(`/api/reports/employee/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('employee');
    });

    it('should reject accessing other employee report', async () => {
      const otherEmployee = { ...mockEmployee, id: 99, team_id: 2 };

      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(otherEmployee)
        .mockResolvedValueOnce(mockEmployee);

      const res = await request(app)
        .get(`/api/reports/employee/${otherEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent employee', async () => {
      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(mockManager);

      const res = await request(app)
        .get('/api/reports/employee/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject without token', async () => {
      const res = await request(app).get(`/api/reports/employee/${mockEmployee.id}`);

      expect(res.status).toBe(401);
    });
  });
});
