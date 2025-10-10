import { Request, Response, NextFunction } from 'express';

type ValidationRule = {
  field: string;
  required?: boolean;
  type?: 'string' | 'number' | 'email' | 'boolean';
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  min?: number;
  max?: number;
};

// Security: Sanitize string input to prevent XSS
const sanitizeString = (value: string): string => {
  return value
    .trim()
    .replace(/[<>]/g, '') // Remove potential script tags
    .substring(0, 1000); // Limit string length to prevent DoS
};

// Security: Validate email format strictly
const isValidEmail = (email: string): boolean => {
  // More strict email validation
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email) && email.length <= 254;
};

// Security: Detect SQL injection patterns
const containsSqlInjection = (value: string): boolean => {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE)\b)/i,
    /(;|\-\-|\/\*|\*\/|xp_|sp_)/i,
    /(\bOR\b.*=.*|1\s*=\s*1)/i
  ];
  return sqlPatterns.some(pattern => pattern.test(value));
};

export const validate = (rules: ValidationRule[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const errors: string[] = [];

    for (const rule of rules) {
      let value = req.body[rule.field];

      // Check required
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${rule.field} is required`);
        continue;
      }

      // Skip if not required and empty
      if (!rule.required && (value === undefined || value === null || value === '')) {
        continue;
      }

      // Type validation
      if (rule.type === 'string') {
        if (typeof value !== 'string') {
          errors.push(`${rule.field} must be a string`);
          continue;
        }

        // Security: Sanitize string inputs
        value = sanitizeString(value);
        req.body[rule.field] = value;

        // Security: Check for SQL injection attempts
        if (containsSqlInjection(value)) {
          errors.push(`${rule.field} contains invalid characters`);
          continue;
        }
      } else if (rule.type === 'number') {
        if (typeof value !== 'number' || isNaN(value)) {
          errors.push(`${rule.field} must be a valid number`);
          continue;
        }

        // Number range validation
        if (rule.min !== undefined && value < rule.min) {
          errors.push(`${rule.field} must be at least ${rule.min}`);
        }
        if (rule.max !== undefined && value > rule.max) {
          errors.push(`${rule.field} must be at most ${rule.max}`);
        }
      } else if (rule.type === 'email') {
        if (typeof value !== 'string' || !isValidEmail(value)) {
          errors.push(`${rule.field} must be a valid email address`);
          continue;
        }
        // Sanitize email
        req.body[rule.field] = value.toLowerCase().trim();
      } else if (rule.type === 'boolean' && typeof value !== 'boolean') {
        errors.push(`${rule.field} must be a boolean`);
      }

      // String length validation
      if (rule.minLength && typeof value === 'string' && value.length < rule.minLength) {
        errors.push(`${rule.field} must be at least ${rule.minLength} characters`);
      }
      if (rule.maxLength && typeof value === 'string' && value.length > rule.maxLength) {
        errors.push(`${rule.field} must be at most ${rule.maxLength} characters`);
      }

      // Pattern validation
      if (rule.pattern && typeof value === 'string' && !rule.pattern.test(value)) {
        errors.push(`${rule.field} has invalid format`);
      }
    }

    if (errors.length > 0) {
      res.status(400).json({ error: 'Validation failed', details: errors });
      return;
    }

    next();
  };
};
