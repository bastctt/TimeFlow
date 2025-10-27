import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import { generateToken } from '../middleware/auth';
import type { User } from '../types/user';
import type { Team } from '../types/team';

jest.mock('../config/database', () => ({
  default: {},
}));
jest.mock('../models/User.model', () => ({
  UserModel: {
    findById: jest.fn(),
    update: jest.fn(),
  },
}));
jest.mock('../models/Team.model', () => ({
  TeamModel: {
    findById: jest.fn(),
    findByManagerId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    getMembers: jest.fn(),
  },
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;
const mockTeamModel = TeamModel as jest.Mocked<typeof TeamModel>;

describe('Teams Routes', () => {
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

  const managerToken = generateToken({ id: mockManager.id, email: mockManager.email });
  const employeeToken = generateToken({ id: mockEmployee.id, email: mockEmployee.email });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/teams', () => {
    it('should create team as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.create.mockResolvedValue(mockTeam);
      mockUserModel.update.mockResolvedValue(mockManager);

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
      mockUserModel.findById.mockResolvedValue(mockEmployee);

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
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findByManagerId.mockResolvedValue([mockTeam]);

      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('teams');
      expect(Array.isArray(res.body.teams)).toBe(true);
    });

    it('should reject employees', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get('/api/teams')
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/teams/:id', () => {
    it('should get team by id', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findById.mockResolvedValue(mockTeam);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('team');
      expect(res.body.team).toHaveProperty('id', mockTeam.id);
    });

    it('should return 404 for non-existent team', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/teams/99999')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/teams/:id/members', () => {
    it('should get team members as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockTeamModel.getMembers.mockResolvedValue([mockEmployee]);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('members');
      expect(Array.isArray(res.body.members)).toBe(true);
    });

    it('should return 404 for non-existent team', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.findById.mockResolvedValue(null);

      const res = await request(app)
        .get('/api/teams/99999/members')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(404);
    });

    it('should reject employee access', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .get(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/teams/:id', () => {
    it('should update team as manager', async () => {
      const updatedTeam = { ...mockTeam, name: 'Updated Team' };

      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.update.mockResolvedValue(updatedTeam);

      const res = await request(app)
        .put(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ name: 'Updated Team' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('team');
      expect(res.body.team).toHaveProperty('name', 'Updated Team');
    });

    it('should reject employee', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .put(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ name: 'Test' });

      expect(res.status).toBe(403);
    });
  });

  describe('POST /api/teams/:id/members', () => {
    it('should add member as manager', async () => {
      mockUserModel.findById
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockEmployee);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockUserModel.update.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .post(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({ user_id: mockEmployee.id });

      expect(res.status).toBe(200);
    });

    it('should reject employee', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .post(`/api/teams/${mockTeam.id}/members`)
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({ user_id: mockEmployee.id });

      expect(res.status).toBe(403);
    });
  });

  describe('DELETE /api/teams/:teamId/members/:userId', () => {
    it('should reject employee', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}/members/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should remove member as manager', async () => {
      mockUserModel.findById
        .mockResolvedValueOnce(mockManager)
        .mockResolvedValueOnce(mockEmployee);
      mockTeamModel.findById.mockResolvedValue(mockTeam);
      mockUserModel.update.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}/members/${mockEmployee.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/teams/:id', () => {
    it('should reject employee', async () => {
      mockUserModel.findById.mockResolvedValue(mockEmployee);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${employeeToken}`);

      expect(res.status).toBe(403);
    });

    it('should delete team as manager', async () => {
      mockUserModel.findById.mockResolvedValue(mockManager);
      mockTeamModel.delete.mockResolvedValue(true);

      const res = await request(app)
        .delete(`/api/teams/${mockTeam.id}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
    });
  });
});
