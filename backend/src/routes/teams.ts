import { Router, Response } from 'express';
import { TeamModel } from '../models/Team.model';
import { UserModel } from '../models/User.model';
import { validate } from '../middleware/validation';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import type { TeamCreate, TeamUpdate } from '../types/team';

const router = Router();

// All routes require authentication and Manager role
router.use(authenticateToken, requireManager);

// Get manager's team only
router.get(
  '/',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get current manager
      const manager = await UserModel.findById(req.user.id);

      if (!manager || !manager.team_id) {
        res.status(200).json({ teams: [] });
        return;
      }

      // Get only manager's team
      const team = await TeamModel.findById(manager.team_id);

      if (!team) {
        res.status(200).json({ teams: [] });
        return;
      }

      res.status(200).json({ teams: [team] });
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
    { field: 'description', required: false, type: 'string' },
    { field: 'manager_id', required: true, type: 'number' }
  ]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      const teamData: TeamCreate = req.body;

      const team = await TeamModel.create(teamData);

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
