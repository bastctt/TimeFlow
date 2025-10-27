import { Router, Response } from 'express';
import { TeamModel } from '../models/Team.model';
import { UserModel } from '../models/User.model';
import { validate } from '../middleware/validation';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import type { TeamCreate, TeamUpdate } from '../types/team';

const router = Router();

// All routes require authentication and Manager role
router.use(authenticateToken, requireManager);

// Get all teams managed by the current manager
router.get(
  '/',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get all teams where this user is the manager
      const teams = await TeamModel.findByManagerId(req.user.id);

      res.status(200).json({ teams });
    } catch (error) {
      console.error('Get teams error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get team by ID
router.get(
  '/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: 'Invalid team ID' });
        return;
      }

      const team = await TeamModel.findById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      res.status(200).json({ team });
    } catch (error) {
      console.error('Get team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Get team members
router.get(
  '/:id/members',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: 'Invalid team ID' });
        return;
      }

      const team = await TeamModel.findById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      const members = await TeamModel.getMembers(teamId);

      res.status(200).json({ members });
    } catch (error) {
      console.error('Get team members error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Create team
router.post(
  '/',
  validate([
    { field: 'name', required: true, type: 'string', minLength: 2 },
    { field: 'description', required: false, type: 'string' }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Auto-assign manager_id from authenticated user
      const teamData: TeamCreate = {
        ...req.body,
        manager_id: req.user.id
      };

      const team = await TeamModel.create(teamData);

      // Update manager's team_id to link them to the new team
      await UserModel.update(req.user.id, { team_id: team.id });

      res.status(201).json({
        message: 'Team created successfully',
        team
      });
    } catch (error) {
      console.error('Create team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Update team
router.put(
  '/:id',
  validate([
    { field: 'name', required: false, type: 'string', minLength: 2 },
    { field: 'description', required: false, type: 'string' },
    { field: 'manager_id', required: false, type: 'number' }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: 'Invalid team ID' });
        return;
      }

      const teamData: TeamUpdate = req.body;

      const team = await TeamModel.update(teamId, teamData);

      if (!team) {
        res.status(404).json({ error: 'Team not found or no changes made' });
        return;
      }

      res.status(200).json({
        message: 'Team updated successfully',
        team
      });
    } catch (error) {
      console.error('Update team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Add employee to team
router.post(
  '/:id/members',
  validate([
    { field: 'user_id', required: true, type: 'number' }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: 'Invalid team ID' });
        return;
      }

      // Verify team exists and belongs to this manager
      const team = await TeamModel.findById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      if (team.manager_id !== req.user.id) {
        res.status(403).json({ error: 'You can only add members to your own team' });
        return;
      }

      const { user_id } = req.body;

      // Verify user exists and is an employee
      const user = await UserModel.findById(user_id);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.role !== 'Employé') {
        res.status(400).json({ error: 'Only employees can be added to teams' });
        return;
      }

      // Update user's team_id
      await UserModel.update(user_id, { team_id: teamId });

      res.status(200).json({
        message: 'Employee added to team successfully'
      });
    } catch (error) {
      console.error('Add team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Remove employee from team
router.delete(
  '/:id/members/:userId',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const teamId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      if (isNaN(teamId) || isNaN(userId)) {
        res.status(400).json({ error: 'Invalid team ID or user ID' });
        return;
      }

      // Verify team exists and belongs to this manager
      const team = await TeamModel.findById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      if (team.manager_id !== req.user.id) {
        res.status(403).json({ error: 'You can only remove members from your own team' });
        return;
      }

      // Verify user exists and is in this team
      const user = await UserModel.findById(userId);

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      if (user.team_id !== teamId) {
        res.status(400).json({ error: 'User is not in this team' });
        return;
      }

      // Remove user from team
      await UserModel.update(userId, { team_id: null });

      res.status(200).json({
        message: 'Employee removed from team successfully'
      });
    } catch (error) {
      console.error('Remove team member error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Delete team
router.delete(
  '/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teamId = parseInt(req.params.id);

      if (isNaN(teamId)) {
        res.status(400).json({ error: 'Invalid team ID' });
        return;
      }

      const deleted = await TeamModel.delete(teamId);

      if (!deleted) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      res.status(200).json({
        message: 'Team deleted successfully'
      });
    } catch (error) {
      console.error('Delete team error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
