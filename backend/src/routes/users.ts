import { Router, Response } from 'express';
import { validate } from '../middleware/validation';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import { UserModel } from '../models/User.model';
import { ClockModel } from '../models/Clock.model';
import type { UserRegistration } from '../types/user';

const router = Router();

// Get all users (Manager only)
router.get(
  '/',
  authenticateToken,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const users = await UserModel.findAll();
      const usersResponse = users.map(user => UserModel.toResponse(user));

      res.status(200).json({ users: usersResponse });
    } catch (error) {
      console.error('Get all users error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get all employees (Manager only - filtered by manager's teams)
router.get(
  '/employees',
  authenticateToken,
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get all teams managed by this manager
      const { TeamModel } = await import('../models/Team.model');
      const managedTeams = await TeamModel.findByManagerId(req.user.id);

      if (managedTeams.length === 0) {
        res.status(200).json({ users: [] });
        return;
      }

      // Get team IDs
      const teamIds = managedTeams.map(team => team.id);

      // Get all employees from all managed teams
      const allEmployees = await UserModel.findByRole('Employé');
      const teamEmployees = allEmployees.filter(emp => emp.team_id && teamIds.includes(emp.team_id));
      const employeesResponse = teamEmployees.map(user => UserModel.toResponse(user));

      res.status(200).json({ users: employeesResponse });
    } catch (error) {
      console.error('Get employees error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Create a new employee (Manager only)
router.post(
  '/',
  authenticateToken,
  requireManager,
  validate([
    { field: 'email', required: true, type: 'email' },
    { field: 'password', required: true, type: 'string', minLength: 6 },
    { field: 'first_name', required: true, type: 'string', minLength: 2 },
    { field: 'last_name', required: true, type: 'string', minLength: 2 }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { email, password, first_name, last_name } = req.body;

      // Get teams managed by this manager
      const { TeamModel } = await import('../models/Team.model');
      const managedTeams = await TeamModel.findByManagerId(req.user.id);

      if (managedTeams.length === 0) {
        res.status(400).json({ error: 'Manager not assigned to any team' });
        return;
      }

      // Check if user already exists
      const existingUser = await UserModel.findByEmail(email);

      if (existingUser) {
        res.status(409).json({ error: 'User with this email already exists' });
        return;
      }

      // Create employee (force role to Employé)
      const userData: UserRegistration = {
        email,
        password,
        first_name,
        last_name,
        role: 'Employé'
      };

      const newUser = await UserModel.create(userData);

      // Assign employee to manager's first team (default team)
      await UserModel.update(newUser.id, { team_id: managedTeams[0].id });

      // Get updated user
      const updatedUser = await UserModel.findById(newUser.id);
      const userResponse = updatedUser ? UserModel.toResponse(updatedUser) : UserModel.toResponse(newUser);

      res.status(201).json({
        message: 'Employee created successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Create employee error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update user profile
// - Users can update their own profile
// - Managers can update employees from their teams
router.put(
  '/:id',
  authenticateToken,
  validate([
    { field: 'email', required: false, type: 'email' },
    { field: 'first_name', required: false, type: 'string', minLength: 2 },
    { field: 'last_name', required: false, type: 'string', minLength: 2 }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      const { email, first_name, last_name } = req.body;

      // Check if user is updating their own profile
      const isOwnProfile = userId === req.user.id;

      // Get user to update
      const userToUpdate = await UserModel.findById(userId);

      if (!userToUpdate) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // If not updating own profile, check manager permissions
      if (!isOwnProfile) {
        // Must be a manager
        const currentUser = await UserModel.findById(req.user.id);
        if (!currentUser || currentUser.role !== 'Manager') {
          res.status(403).json({ error: 'Forbidden: Only managers can update other users' });
          return;
        }

        // Can only update employees
        if (userToUpdate.role !== 'Employé') {
          res.status(403).json({ error: 'Can only update employees' });
          return;
        }

        // Get teams managed by this manager
        const { TeamModel } = await import('../models/Team.model');
        const managedTeams = await TeamModel.findByManagerId(req.user.id);

        if (managedTeams.length === 0) {
          res.status(400).json({ error: 'Manager not assigned to any team' });
          return;
        }

        const teamIds = managedTeams.map(t => t.id);

        // Check if employee belongs to one of manager's teams
        if (!userToUpdate.team_id || !teamIds.includes(userToUpdate.team_id)) {
          res.status(403).json({ error: 'Can only update employees from your teams' });
          return;
        }
      }

      // Check if email is already taken by another user
      if (email) {
        const existingUser = await UserModel.findByEmail(email);
        if (existingUser && existingUser.id !== userId) {
          res.status(409).json({ error: 'Email already taken by another user' });
          return;
        }
      }

      // Update user
      const updatedUser = await UserModel.update(userId, {
        email,
        first_name,
        last_name
      });

      if (!updatedUser) {
        res.status(404).json({ error: 'User not found or no changes made' });
        return;
      }

      const userResponse = UserModel.toResponse(updatedUser);

      res.status(200).json({
        message: isOwnProfile ? 'Profile updated successfully' : 'Employee updated successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Update employee error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete a user
// Manager can delete employees
// Any user can delete their own account
router.delete(
  '/:id',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      // Get current user from database
      const currentUser = await UserModel.findById(req.user.id);

      if (!currentUser) {
        res.status(404).json({ error: 'Current user not found' });
        return;
      }

      // Check if user is trying to delete their own account
      const isDeletingOwnAccount = userId === req.user.id;

      if (!isDeletingOwnAccount) {
        // If not deleting own account, must be a manager
        if (currentUser.role !== 'Manager') {
          res.status(403).json({ error: 'Only managers can delete other users' });
          return;
        }

        // Check if manager has a team
        if (!currentUser.team_id) {
          res.status(400).json({ error: 'Manager not assigned to a team' });
          return;
        }

        // Check if user to delete exists and is an employee
        const userToDelete = await UserModel.findById(userId);

        if (!userToDelete) {
          res.status(404).json({ error: 'User not found' });
          return;
        }

        if (userToDelete.role !== 'Employé') {
          res.status(403).json({ error: 'Can only delete employees' });
          return;
        }

        // Check if employee belongs to manager's team
        if (userToDelete.team_id !== currentUser.team_id) {
          res.status(403).json({ error: 'Can only delete employees from your team' });
          return;
        }
      }

      // Delete user
      const deleted = await UserModel.delete(userId);

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.status(200).json({
        message: isDeletingOwnAccount
          ? 'Account deleted successfully'
          : 'Employee deleted successfully'
      });
    } catch (error) {
      console.error('Delete user error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/users/:id/clocks
 * Get clock entries for a specific user
 * Accessible by:
 * - The user themselves
 * - Managers of the same team
 */
router.get(
  '/:id/clocks',
  authenticateToken,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const userId = parseInt(req.params.id);

      if (isNaN(userId)) {
        res.status(400).json({ error: 'Invalid user ID' });
        return;
      }

      // Check if user exists
      const targetUser = await UserModel.findById(userId);

      if (!targetUser) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      // Authorization check
      const currentUser = await UserModel.findById(req.user.id);

      if (!currentUser) {
        res.status(404).json({ error: 'Current user not found' });
        return;
      }

      // Allow if:
      // 1. User is viewing their own clocks
      // 2. User is a manager of the same team
      const isSelf = userId === req.user.id;
      const isManagerOfSameTeam =
        currentUser.role === 'Manager' &&
        currentUser.team_id &&
        currentUser.team_id === targetUser.team_id;

      if (!isSelf && !isManagerOfSameTeam) {
        res.status(403).json({
          error: 'Access forbidden: You can only view your own clocks or clocks of your team members'
        });
        return;
      }

      const { start_date, end_date } = req.query;

      const startDate = start_date ? new Date(start_date as string) : undefined;
      const endDate = end_date ? new Date(end_date as string) : undefined;

      const clocks = await ClockModel.findByUserId(userId, startDate, endDate);

      // Calculate working hours
      const workingHours = ClockModel.calculateWorkingHours(clocks);
      const totalHours = ClockModel.calculateTotalHours(workingHours);

      res.status(200).json({
        user: {
          id: targetUser.id,
          email: targetUser.email,
          first_name: targetUser.first_name,
          last_name: targetUser.last_name,
          role: targetUser.role
        },
        clocks,
        working_hours: workingHours,
        total_hours: totalHours
      });
    } catch (error) {
      console.error('Get user clocks error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
