import { Router, Response } from 'express';
import { validate } from '../middleware/validation';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import { AbsenceModel } from '../models/Absence.model';
import { UserModel } from '../models/User.model';
import type { AbsenceCreate, AbsenceUpdate } from '../types/absence';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/absences
 * Create an absence for the authenticated user
 */
router.post(
  '/',
  validate([{ field: 'date', required: true, type: 'string' }]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { date, type, reason } = req.body;

      // Validate date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(date)) {
        res.status(400).json({ error: 'Invalid date format. Expected YYYY-MM-DD' });
        return;
      }

      // Validate type if provided
      const validTypes = ['sick', 'vacation', 'personal', 'other'];
      if (type && !validTypes.includes(type)) {
        res.status(400).json({ error: 'Invalid absence type' });
        return;
      }

      const absenceData: AbsenceCreate = {
        date,
        type: type || 'other',
        reason,
      };

      const absence = await AbsenceModel.create(req.user.id, absenceData);

      res.status(201).json({
        message: 'Absence created successfully',
        absence,
      });
    } catch (error) {
      console.error('Create absence error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/absences
 * Get all absences for the authenticated user
 */
router.get('/', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { start_date, end_date } = req.query;

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const absences = await AbsenceModel.findByUserId(req.user.id, startDate, endDate);

    res.status(200).json({ absences });
  } catch (error) {
    console.error('Get absences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/absences/potential
 * Detect potential absences (days without clocks or marked absences)
 */
router.get('/potential', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { start_date, end_date } = req.query;

    // Default to last 30 days if not specified
    const endDate = end_date ? new Date(end_date as string) : new Date();
    const startDate = start_date
      ? new Date(start_date as string)
      : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    const potentialAbsences = await AbsenceModel.detectPotentialAbsences(
      req.user.id,
      startDate,
      endDate
    );

    res.status(200).json({
      potential_absences: potentialAbsences,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
      },
    });
  } catch (error) {
    console.error('Detect potential absences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/absences/stats
 * Get absence statistics for the authenticated user
 */
router.get('/stats', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { start_date, end_date } = req.query;

    // Default to current year if not specified
    const now = new Date();
    const startDate = start_date ? new Date(start_date as string) : new Date(now.getFullYear(), 0, 1);
    const endDate = end_date ? new Date(end_date as string) : new Date(now.getFullYear(), 11, 31);

    const stats = await AbsenceModel.getStats(req.user.id, startDate, endDate);

    res.status(200).json({ stats });
  } catch (error) {
    console.error('Get absence stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/absences/:id
 * Update an absence
 * Users can update their own absences
 * Managers can approve absences
 */
router.put('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const absenceId = parseInt(req.params.id);

    if (isNaN(absenceId)) {
      res.status(400).json({ error: 'Invalid absence ID' });
      return;
    }

    const absence = await AbsenceModel.findById(absenceId);

    if (!absence) {
      res.status(404).json({ error: 'Absence not found' });
      return;
    }

    // Check authorization
    const currentUser = await UserModel.findById(req.user.id);
    if (!currentUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const isOwner = absence.user_id === req.user.id;
    const isManager = currentUser.role === 'Manager';

    if (!isOwner && !isManager) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const { type, reason, approved } = req.body;

    // Validate type if provided
    const validTypes = ['sick', 'vacation', 'personal', 'other'];
    if (type && !validTypes.includes(type)) {
      res.status(400).json({ error: 'Invalid absence type' });
      return;
    }

    // Only managers can approve
    if (approved !== undefined && !isManager) {
      res.status(403).json({ error: 'Only managers can approve absences' });
      return;
    }

    const updateData: AbsenceUpdate = {};
    if (type !== undefined) updateData.type = type;
    if (reason !== undefined) updateData.reason = reason;
    if (approved !== undefined) updateData.approved = approved;

    const updatedAbsence = await AbsenceModel.update(absenceId, updateData);

    res.status(200).json({
      message: 'Absence updated successfully',
      absence: updatedAbsence,
    });
  } catch (error) {
    console.error('Update absence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/absences/:id
 * Delete an absence
 */
router.delete('/:id', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const absenceId = parseInt(req.params.id);

    if (isNaN(absenceId)) {
      res.status(400).json({ error: 'Invalid absence ID' });
      return;
    }

    const absence = await AbsenceModel.findById(absenceId);

    if (!absence) {
      res.status(404).json({ error: 'Absence not found' });
      return;
    }

    // Only the owner can delete their absence
    if (absence.user_id !== req.user.id) {
      res.status(403).json({ error: 'Forbidden: You can only delete your own absences' });
      return;
    }

    await AbsenceModel.delete(absenceId);

    res.status(200).json({ message: 'Absence deleted successfully' });
  } catch (error) {
    console.error('Delete absence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/absences/team
 * Get absences for all team members (Manager only)
 */
router.get('/team', requireManager, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { start_date, end_date } = req.query;

    // Get manager's team
    const { TeamModel } = await import('../models/Team.model');
    const teams = await TeamModel.findByManagerId(req.user.id);

    if (teams.length === 0) {
      res.status(200).json({ absences: [] });
      return;
    }

    // Get all team members
    const teamMembers = await UserModel.findByTeamIds(teams.map(t => t.id));
    const memberIds = teamMembers.map(m => m.id);

    const startDate = start_date ? new Date(start_date as string) : undefined;
    const endDate = end_date ? new Date(end_date as string) : undefined;

    const absences = await AbsenceModel.findByUserIds(memberIds, startDate, endDate);

    res.status(200).json({ absences });
  } catch (error) {
    console.error('Get team absences error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/absences/:id/approve
 * Approve an absence (Manager only)
 */
router.post('/:id/approve', requireManager, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const absenceId = parseInt(req.params.id);

    if (isNaN(absenceId)) {
      res.status(400).json({ error: 'Invalid absence ID' });
      return;
    }

    const absence = await AbsenceModel.findById(absenceId);

    if (!absence) {
      res.status(404).json({ error: 'Absence not found' });
      return;
    }

    // Verify the absence belongs to a team member
    const { TeamModel } = await import('../models/Team.model');
    const teams = await TeamModel.findByManagerId(req.user.id);
    const teamMembers = await UserModel.findByTeamIds(teams.map(t => t.id));
    const memberIds = teamMembers.map(m => m.id);

    if (!memberIds.includes(absence.user_id)) {
      res.status(403).json({ error: 'You can only approve absences for your team members' });
      return;
    }

    const updatedAbsence = await AbsenceModel.approve(absenceId, req.user.id);

    res.status(200).json({
      message: 'Absence approved successfully',
      absence: updatedAbsence,
    });
  } catch (error) {
    console.error('Approve absence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/absences/:id/reject
 * Reject an absence (Manager only)
 */
router.post('/:id/reject', requireManager, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const absenceId = parseInt(req.params.id);

    if (isNaN(absenceId)) {
      res.status(400).json({ error: 'Invalid absence ID' });
      return;
    }

    const absence = await AbsenceModel.findById(absenceId);

    if (!absence) {
      res.status(404).json({ error: 'Absence not found' });
      return;
    }

    // Verify the absence belongs to a team member
    const { TeamModel } = await import('../models/Team.model');
    const teams = await TeamModel.findByManagerId(req.user.id);
    const teamMembers = await UserModel.findByTeamIds(teams.map(t => t.id));
    const memberIds = teamMembers.map(m => m.id);

    if (!memberIds.includes(absence.user_id)) {
      res.status(403).json({ error: 'You can only reject absences for your team members' });
      return;
    }

    const updatedAbsence = await AbsenceModel.reject(absenceId, req.user.id);

    res.status(200).json({
      message: 'Absence rejected successfully',
      absence: updatedAbsence,
    });
  } catch (error) {
    console.error('Reject absence error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
