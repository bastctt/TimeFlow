import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import { generateToken } from '../middleware/auth';

jest.mock('../config/database');
jest.mock('../models/User.model', () => ({
  UserModel: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../models/Team.model', () => ({
  TeamModel: {
    findById: jest.fn(),
    findAll: jest.fn(),
    findByManagerId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getMembers: jest.fn(),
  },
}));

describe('Teams Routes', () => {
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

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/teams', () => {
    it('should create team as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.create as jest.Mock).mockResolvedValue(mockTeam);
      (UserModel.update as jest.Mock).mockResolvedValue(mockManager);

      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Test Team',
          description: 'Test Description'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('team');
      expect(res.body.team).toHaveProperty('name', 'Test Team');
    });

    it('should reject employee', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .post('/api/teams')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test Team' });

      expect(res.status).toBe(403);
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .post('/api/teams')
        .send({ name: 'Test' });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/teams', () => {
    it('should get all teams as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findByManagerId as jest.Mock).mockResolvedValue([mockTeam]);

      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('teams');
      expect(Array.isArray(res.body.teams)).toBe(true);
    });

    it('should reject employees', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team by id', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('team');
      expect(res.body.team).toHaveProperty('id', mockTeam.id);
    });

    it('should return 404 for non-existent team', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/teams/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/teams/:id/members', () => {
    it('should get team members as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (TeamModel.getMembers as jest.Mock).mockResolvedValue([mockEmployee]);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('members');
      expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('should return 404 for non-existent team', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.findById as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/teams/99999/members')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject employee access', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team as manager', async () => {
      const updatedTeam = { ...mockTeam, name: 'Updated Team' };

      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.update as jest.Mock).mockResolvedValue(updatedTeam);

      const res = await request(app)
        .put(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Team' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('team');
      expect(res.body.team).toHaveProperty('name', 'Updated Team');
    });

    it('should reject employee', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .put(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add member as manager', async () => {
      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockEmployee);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (UserModel.update as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .post(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ user_id: mockEmployee.id });

      expect(res.status).toBe(200);
    });

    it('should reject employee', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .post(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: mockEmployee.id });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/teams/:teamId/members/:userId', () => {
    it('should reject employee', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}/members/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should remove member as manager', async () => {
      (UserModel.findById as jest.Mock)
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockEmployee);
      (TeamModel.findById as jest.Mock).mockResolvedValue(mockTeam);
      (UserModel.update as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}/members/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should reject employee', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should delete team as manager', async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(mockManager);
      (TeamModel.delete as jest.Mock).mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
