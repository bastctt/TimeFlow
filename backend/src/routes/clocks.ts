import { Router, Response } from 'express';
import { validate } from '../middleware/validation';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { ClockModel } from '../models/Clock.model';
import type { ClockCreate } from '../types/clock';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * POST /api/clocks
 * Create a clock entry (check-in or check-out) for the authenticated user
 */
router.post(
  '/',
  validate([{ field: 'status', required: true, type: 'string' }]),
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const { status, clock_time } = req.body;

      // Validate status
      if (status !== 'check-in' && status !== 'check-out') {
        res.status(400).json({ error: 'Status must be either check-in or check-out' });
        return;
      }

      // Get last clock entry to validate the sequence
      const lastClock = await ClockModel.getLastClock(req.user.id);

      // Business rule: prevent consecutive check-ins or check-outs
      if (lastClock && lastClock.status === status) {
        res.status(400).json({
          error: `Cannot ${status} twice in a row. Last clock was a ${lastClock.status} at ${lastClock.clock_time}`
        });
        return;
      }

      // Create clock entry
      const clockData: ClockCreate = {
        status,
        clock_time: clock_time ? new Date(clock_time) : undefined
      };

      const newClock = await ClockModel.create(req.user.id, clockData);

      res.status(201).json({
        message: `Successfully clocked ${status}`,
        clock: newClock
      });
    } catch (error) {
      console.error('Create clock error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/clocks
 * Get all clock entries for the authenticated user
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

    const clocks = await ClockModel.findByUserId(req.user.id, startDate, endDate);

    // Calculate working hours
    const workingHours = ClockModel.calculateWorkingHours(clocks);
    const totalHours = ClockModel.calculateTotalHours(workingHours);

    res.status(200).json({
      clocks,
      working_hours: workingHours,
      total_hours: totalHours
    });
  } catch (error) {
    console.error('Get clocks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/clocks/status
 * Get the current clock status for the authenticated user
 */
router.get('/status', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const lastClock = await ClockModel.getLastClock(req.user.id);

    if (!lastClock) {
      res.status(200).json({
        is_clocked_in: false,
        last_clock: null
      });
      return;
    }

    res.status(200).json({
      is_clocked_in: lastClock.status === 'check-in',
      last_clock: lastClock
    });
  } catch (error) {
    console.error('Get clock status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
