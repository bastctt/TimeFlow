import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import { ClockModel } from '../models/Clock.model';
import { generateToken } from '../middleware/auth';
import type { User } from '../types/user';
import type { Team } from '../types/team';
import type { DailyReport, WeeklyReport, AdvancedKPIs } from '../types/clock';

jest.mock('../config/database', () => ({
  default: {},
}));
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

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTeamModel = TeamModel as jest.Mocked<typeof TeamModel>;
const mockClockModel = ClockModel as jest.Mocked<typeof ClockModel>;

describe('Reports Routes', () => {
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

  const mockTeam: Team = {
    id: 1,
    name: 'Test Team',
    description: 'Test Description',
    manager_id: mockManager.id,
    created_at: new Date(),
    updated_at: new Date()
  };

  const mockDailyReport: DailyReport = {
    user_id: mockEmployee.id,
    date: new Date().toISOString().split('T')[0],
    hours_worked: 8,
    first_name: 'Employee',
    last_name: 'Test',
    email: mockEmployee.email,
    check_in: null,
    check_out: null,
    is_absent: false,
    missing_checkout: false
  };

  const mockWeeklyReport: WeeklyReport = {
    user_id: mockEmployee.id,
    week_start: new Date().toISOString().split('T')[0],
    week_end: new Date().toISOString().split('T')[0],
    total_hours: 40,
    days_worked: 5,
    first_name: 'Employee',
    last_name: 'Test',
    email: mockEmployee.email,
    average_daily_hours: 8
  };

  const mockKPIs: AdvancedKPIs = {
    attendance_rate: 100,
    active_employees_today: 5,
    average_check_in_time: '09:00',
    punctuality_rate: 95,
    overtime_hours: 2,
    total_workdays: 20,
    total_days_worked: 20,
    late_arrivals: 1
  };

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/reports', () => {
    it('should get team report as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([mockTeam]);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockTeamModel.getMembers.mockResolvedValue([mockEmployee]);
      mockClockModel.getDailyReports.mockResolvedValue([mockDailyReport]);
      mockClockModel.getWeeklyReports.mockResolvedValue([mockWeeklyReport]);
      mockClockModel.getAdvancedKPIs.mockResolvedValue(mockKPIs);

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
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([mockTeam]);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockTeamModel.getMembers.mockResolvedValue([mockEmployee]);
      mockClockModel.getDailyReports.mockResolvedValue([mockDailyReport]);

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
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([mockTeam]);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockTeamModel.getMembers.mockResolvedValue([mockEmployee]);
      mockClockModel.getWeeklyReports.mockResolvedValue([mockWeeklyReport]);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${managerToken}`)
        .query({ type: 'weekly' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('reports');
      expect(res.body.type).toBe('weekly');
    });

    it('should reject employee access', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/reports')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should reject manager without team', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([]);

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
      mockUserModel.findById.mockResolvedValue(mockEmployee);
      mockClockModel.getDailyReports.mockResolvedValue([mockDailyReport]);
      mockClockModel.getWeeklyReports.mockResolvedValue([mockWeeklyReport]);

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
      mockUserModel.findById
        .mockResolvedValueOnce(mockEmployee)
        .mockResolvedValueOnce(mockManager);
      mockClockModel.getDailyReports.mockResolvedValue([mockDailyReport]);
      mockClockModel.getWeeklyReports.mockResolvedValue([mockWeeklyReport]);

      const res = await request(app)
        .get(`/api/reports/employee/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('employee');
    });

    it('should reject accessing other employee report', async () => {
      const otherEmployee = { ...mockEmployee, id: 99, team_id: 2 };

      mockUserModel.findById
        .mockResolvedValueOnce(otherEmployee)
        .mockResolvedValueOnce(mockEmployee);

      const res = await request(app)
        .get(`/api/reports/employee/${otherEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should return 404 for non-existent employee', async () => {
      mockUserModel.findById
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
