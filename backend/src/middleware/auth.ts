import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
  };
}

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not defined');
    }

    const decoded = jwt.verify(token, secret, {
      issuer: 'timemanager-api',
      audience: 'timemanager-client',
      algorithms: ['HS256']
    }) as { id: number; email: string };

    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Token expired' });
    } else if (error instanceof jwt.JsonWebTokenError) {
      res.status(403).json({ error: 'Invalid token' });
    } else {
      res.status(403).json({ error: 'Authentication failed' });
    }
  }
};

export const generateToken = (payload: { id: number; email: string }): string => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  // Security: Ensure JWT_SECRET is strong enough
  if (secret.length < 32) {
    console.warn('⚠️  WARNING: JWT_SECRET should be at least 32 characters long for security');
  }

  return jwt.sign(payload, secret, {
    expiresIn: '24h',
    issuer: 'timemanager-api',
    audience: 'timemanager-client',
    algorithm: 'HS256'
  });
};

export const requireManager = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Fetch user from database to check role
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.role !== 'Manager') {
      res.status(403).json({ error: 'Access forbidden: Manager role required' });
      return;
    }

    next();
  } catch (error) {
    console.error('Manager check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
