import { Router, Request, Response } from 'express';
import { validate } from '../middleware/validation';
import { generateToken, authenticateToken, AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User.model';
import { PasswordResetTokenModel } from '../models/PasswordResetToken.model';
import { emailService } from '../services/email.service';
import type { UserRegistration, UserLogin } from '../types/user';

const router = Router();

// Register endpoint
router.post(
  '/register',
  validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 6 },
    { field: 'first_name', required: true, type: 'string', minLength: 2 },
    { field: 'last_name', required: true, type: 'string', minLength: 2 },
    { field: 'role', required: true, type: 'string' }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password, first_name, last_name, role }: UserRegistration = req.body;

      // Validate role
      if (role !== 'Manager' && role !== 'Employé') {
        res.status(400).json({ error: 'Role must be either Manager or Employé' });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);

      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Create user
      const newUser = await UserModel.create({ email, password, first_name, last_name, role });

      // Generate token
      const token = generateToken({ id: newUser.id, email: newUser.email });

      const userResponse = UserModel.toResponse(newUser);

      res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Login endpoint
router.post(
  '/login',
  validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string' }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email, password }: UserLogin = req.body;

      // Find user
      const user = await UserModel.findByEmail(email);

      if (!user) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Check password
      const isValidPassword = await UserModel.verifyPassword(user, password);

      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid email or password' });
        return;
      }

      // Generate token
      const token = generateToken({ id: user.id, email: user.email });

      const userResponse = UserModel.toResponse(user);

      res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        token
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get current user (protected route)
router.get(
  '/me',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Fetch user from database
      const user = await UserModel.findById(req.user.id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      const userResponse = UserModel.toResponse(user);

      res.status(200).json({ user: userResponse });
    } catch (error) {
      console.error('Get current user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Verify token (protected route)
router.get(
  '/verify',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    // If middleware passed, token is valid
    res.status(200).json({
      valid: true,
      user: req.user
    });
  }
);

// Update user (protected route)
router.put(
  '/update',
  authenticateToken,
  validate([
    { field: 'email', required: false, type: 'email' },
    { field: 'first_name', required: false, type: 'string', minLength: 2 },
    { field: 'last_name', required: false, type: 'string', minLength: 2 },
    { field: 'role', required: false, type: 'string' }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { email, first_name, last_name, role } = req.body;

      // Validate role if provided
      if (role && role !== 'Manager' && role !== 'Employé') {
        res.status(400).json({ error: 'Role must be either Manager or Employé' });
        return;
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== req.user.id) {
          res.status(409).json({ error: 'Email already taken by another user' });
          return;
        }
      }

      // Update user
      const updatedUser = await UserModel.update(req.user.id, {
        email,
        first_name,
        last_name,
        role
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found or no changes made' });
        return;
      }

      const userResponse = UserModel.toResponse(updatedUser);

      res.status(200).json({
        message: 'User updated successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Update user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Request password reset endpoint (public)
router.post(
  '/request-reset',
  validate([
    { field: 'email', required: true, type: 'email' }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { email } = req.body;

      // Find user by email
      const user = await UserModel.findByEmail(email);

      // Always return success to prevent email enumeration
      // (don't reveal if email exists or not)
      if (!user) {
        res.status(200).json({
          message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
        });
        return;
      }

      // Create reset token
      const { token } = await PasswordResetTokenModel.create(user.id);

      // Send email
      await emailService.sendPasswordResetEmail(
        user.email,
        user.first_name,
        token
      );

      res.status(200).json({
        message: 'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.'
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Verify reset token endpoint (public)
router.post(
  '/verify-reset-token',
  validate([
    { field: 'token', required: true, type: 'string' }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token } = req.body;

      // Verify token
      const userId = await PasswordResetTokenModel.verify(token);

      if (!userId) {
        res.status(400).json({
          error: 'Token invalide ou expiré'
        });
        return;
      }

      // Get user info (without sensitive data)
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        valid: true,
        email: user.email,
        first_name: user.first_name
      });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Reset password endpoint (public)
router.post(
  '/reset-password',
  validate([
    { field: 'token', required: true, type: 'string' },
    { field: 'password', required: true, type: 'string', minLength: 6 }
  ]),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { token, password } = req.body;

      // Verify token
      const userId = await PasswordResetTokenModel.verify(token);

      if (!userId) {
        res.status(400).json({
          error: 'Token invalide ou expiré'
        });
        return;
      }

      // Update user password
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Update password (will be hashed by the model)
      await UserModel.updatePassword(userId, password);

      // Mark token as used
      await PasswordResetTokenModel.markAsUsed(token);

      // Generate new JWT token for automatic login
      const jwtToken = generateToken({ id: user.id, email: user.email });

      res.status(200).json({
        message: 'Mot de passe réinitialisé avec succès',
        token: jwtToken
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
