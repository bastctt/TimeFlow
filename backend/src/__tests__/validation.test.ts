import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { validate } from '../middleware/validation';

describe('Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
    };
    const statusMock = jest.fn().mockReturnThis();
    const jsonMock = jest.fn().mockReturnThis();
    mockResponse = {
      status: statusMock as unknown as Response['status'],
      json: jsonMock as unknown as Response['json'],
    };
    nextFunction = jest.fn() as NextFunction;
  });

  describe('Required field validation', () => {
    it('should fail when required field is missing', () => {
      const validator = validate([
        { field: 'email', required: true },
      ]);

      mockRequest.body = {};

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['email is required'],
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should pass when required field is present', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'string' },
      ]);

      mockRequest.body = { email: 'test@example.com' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should skip validation for non-required empty fields', () => {
      const validator = validate([
        { field: 'optional', required: false, type: 'string' },
      ]);

      mockRequest.body = {};

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe('Email validation', () => {
    it('should validate correct email format', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'email' },
      ]);

      mockRequest.body = { email: 'test@example.com' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.email).toBe('test@example.com');
    });

    it('should fail for invalid email format', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'email' },
      ]);

      mockRequest.body = { email: 'invalid-email' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['email must be a valid email address'],
      });
    });

    it('should normalize email to lowercase', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'email' },
      ]);

      mockRequest.body = { email: 'TEST@EXAMPLE.COM' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockRequest.body.email).toBe('test@example.com');
    });
  });

  describe('String validation', () => {
    it('should validate string type', () => {
      const validator = validate([
        { field: 'name', required: true, type: 'string' },
      ]);

      mockRequest.body = { name: 'John Doe' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail for non-string type', () => {
      const validator = validate([
        { field: 'name', required: true, type: 'string' },
      ]);

      mockRequest.body = { name: 12345 };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['name must be a string'],
      });
    });

    it('should validate minLength', () => {
      const validator = validate([
        { field: 'password', required: true, type: 'string', minLength: 6 },
      ]);

      mockRequest.body = { password: '123' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['password must be at least 6 characters'],
      });
    });

    it('should validate maxLength', () => {
      const validator = validate([
        { field: 'name', required: true, type: 'string', maxLength: 10 },
      ]);

      mockRequest.body = { name: 'ThisIsAVeryLongName' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['name must be at most 10 characters'],
      });
    });

    it('should sanitize string inputs', () => {
      const validator = validate([
        { field: 'name', required: true, type: 'string' },
      ]);

      mockRequest.body = { name: '  <script>alert("xss")</script>John  ' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockRequest.body.name).not.toContain('<');
      expect(mockRequest.body.name).not.toContain('>');
      expect(mockRequest.body.name).toBe('scriptalert("xss")/scriptJohn');
    });
  });

  describe('Number validation', () => {
    it('should validate number type', () => {
      const validator = validate([
        { field: 'age', required: true, type: 'number' },
      ]);

      mockRequest.body = { age: 25 };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
    });

    it('should fail for invalid number', () => {
      const validator = validate([
        { field: 'age', required: true, type: 'number' },
      ]);

      mockRequest.body = { age: 'not-a-number' };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });

    it('should validate min value', () => {
      const validator = validate([
        { field: 'age', required: true, type: 'number', min: 18 },
      ]);

      mockRequest.body = { age: 15 };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['age must be at least 18'],
      });
    });

    it('should validate max value', () => {
      const validator = validate([
        { field: 'age', required: true, type: 'number', max: 100 },
      ]);

      mockRequest.body = { age: 150 };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: ['age must be at most 100'],
      });
    });
  });

  describe('SQL Injection detection', () => {
    it('should detect SQL injection patterns', () => {
      const validator = validate([
        { field: 'search', required: true, type: 'string' },
      ]);

      const sqlInjectionAttempts = [
        "'; DROP TABLE users; --",
        "1' OR '1'='1",
        "admin'--",
        "1 UNION SELECT * FROM users",
      ];

      sqlInjectionAttempts.forEach(attempt => {
        mockRequest.body = { search: attempt };

        validator(mockRequest as Request, mockResponse as Response, nextFunction);

        expect(mockResponse.status).toHaveBeenCalledWith(400);
        expect(mockResponse.json).toHaveBeenCalledWith({
          error: 'Validation failed',
          details: ['search contains invalid characters'],
        });
      });
    });
  });

  describe('Multiple rules validation', () => {
    it('should validate multiple fields', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'email' },
        { field: 'password', required: true, type: 'string', minLength: 6 },
        { field: 'age', required: true, type: 'number', min: 18 },
      ]);

      mockRequest.body = {
        email: 'test@example.com',
        password: 'password123',
        age: 25,
      };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should collect multiple validation errors', () => {
      const validator = validate([
        { field: 'email', required: true, type: 'email' },
        { field: 'password', required: true, type: 'string', minLength: 6 },
      ]);

      mockRequest.body = {
        email: 'invalid-email',
        password: '123',
      };

      validator(mockRequest as Request, mockResponse as Response, nextFunction);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: expect.arrayContaining([
          'email must be a valid email address',
          'password must be at least 6 characters',
        ]),
      });
    });
  });
});
