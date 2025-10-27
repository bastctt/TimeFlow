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
      if (status !== 'check-in' && status !== 'check-out' && status !== 'absent') {
        res.status(400).json({ error: 'Status must be check-in, check-out, or absent' });
        return;
      }

      // Get last clock entry to validate the sequence
      const lastClock = await ClockModel.getLastClock(req.user.id);

      // Business rule for check-in/check-out: prevent consecutive same status
      if (status !== 'absent' && lastClock && lastClock.status === status) {
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

    // Check if the last check-in is from today (using local timezone)
    const lastClockDate = new Date(lastClock.clock_time);
    const today = new Date();

    // Reset time to midnight for both dates to compare only the date part
    const lastClockDayStart = new Date(lastClockDate.getFullYear(), lastClockDate.getMonth(), lastClockDate.getDate());
    const todayDayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const isSameDay = lastClockDayStart.getTime() === todayDayStart.getTime();

    // Only consider clocked in if:
    // 1. Last status is check-in
    // 2. AND it's from today (not from a previous day)
    const isClockedIn = lastClock.status === 'check-in' && isSameDay;

    res.status(200).json({
      is_clocked_in: isClockedIn,
      last_clock: lastClock
    });
  } catch (error) {
    console.error('Get clock status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/clocks/detect-issues
 * Detect missing check-outs and absent days for the authenticated user
 */
router.get('/detect-issues', async (req: AuthRequest, res: Response): Promise<void> => {
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

    const [missingCheckouts, absentDays] = await Promise.all([
      ClockModel.detectMissingCheckouts(req.user.id, startDate, endDate),
      ClockModel.detectAbsentDays(req.user.id, startDate, endDate)
    ]);

    res.status(200).json({
      missing_checkouts: missingCheckouts,
      absent_days: absentDays,
      period: {
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0]
      }
    });
  } catch (error) {
    console.error('Detect issues error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/clocks/mark-absent
 * Mark a specific date as absent for the authenticated user
 */
router.post('/mark-absent', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const { date } = req.body;

    if (!date) {
      res.status(400).json({ error: 'Date is required' });
      return;
    }

    const absenceDate = new Date(date);
    const absence = await ClockModel.markAbsent(req.user.id, absenceDate);

    res.status(201).json({
      message: 'Absence marked successfully',
      absence
    });
  } catch (error) {
    console.error('Mark absent error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
