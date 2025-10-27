import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../index';
import { UserModel } from '../models/User.model';
import { generateToken } from '../middleware/auth';
import type { User } from '../types/user';

// Mock database
jest.mock('../config/database', () => ({
  default: {},
}));

// Mock UserModel
jest.mock('../models/User.model', () => ({
  UserModel: {
    findByEmail: jest.fn(),
    findById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    verifyPassword: jest.fn(),
    toResponse: jest.fn(),
  },
}));

const mockUserModel = UserModel as jest.Mocked<typeof UserModel>;

describe('Auth Routes', () => {
  const mockUser: User = {
    id: 1,
    email: 'test@example.com',
    password_hash: 'hashed_password',
    first_name: 'Test',
    last_name: 'User',
    role: 'Employé' as const,
    team_id: null
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.create.mockResolvedValue(mockUser);
      mockUserModel.toResponse.mockReturnValue({ ...mockUser });

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          role: 'Employé'
        });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user).toHaveProperty('email', 'test@example.com');
    });

    it('should reject duplicate email', async () => {
      mockUserModel.findByEmail.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          role: 'Employé'
        });

      expect(res.status).toBe(409);
    });

    it('should reject invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
          role: 'Admin'
        });

      expect(res.status).toBe(400);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          first_name: 'Test',
          last_name: 'User',
          role: 'Employé'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      mockUserModel.findByEmail.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(true);
      mockUserModel.toResponse.mockReturnValue({ ...mockUser });

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject wrong password', async () => {
      mockUserModel.findByEmail.mockResolvedValue(mockUser);
      mockUserModel.verifyPassword.mockResolvedValue(false);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      mockUserModel.findByEmail.mockResolvedValue(null);

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123'
        });

      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      const token = generateToken({ id: mockUser.id, email: mockUser.email });
      mockUserModel.findById.mockResolvedValue(mockUser);
      mockUserModel.toResponse.mockReturnValue({ ...mockUser });

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('test@example.com');
    });

    it('should reject without token', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
    });

    it('should reject with invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/auth/verify', () => {
    it('should verify valid token', async () => {
      const token = generateToken({ id: mockUser.id, email: mockUser.email });

      const res = await request(app)
        .get('/api/auth/verify')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.valid).toBe(true);
    });
  });

  describe('PUT /api/auth/update', () => {
    it('should update user info', async () => {
      const token = generateToken({ id: mockUser.id, email: mockUser.email });
      const updatedUser = { ...mockUser, first_name: 'Updated', last_name: 'Name' };

      mockUserModel.findByEmail.mockResolvedValue(null);
      mockUserModel.update.mockResolvedValue(updatedUser);
      mockUserModel.toResponse.mockReturnValue({ ...updatedUser });

      const res = await request(app)
        .put('/api/auth/update')
        .set('Authorization', `Bearer ${token}`)
        .send({
          first_name: 'Updated',
          last_name: 'Name'
        });

      expect(res.status).toBe(200);
      expect(res.body.user.first_name).toBe('Updated');
    });

    it('should reject without token', async () => {
      const res = await request(app)
        .put('/api/auth/update')
        .send({ first_name: 'Test' });

      expect(res.status).toBe(401);
    });
  });
});
