import { Router, Response } from 'express';
import { authenticateToken, requireManager, AuthRequest } from '../middleware/auth';
import { ClockModel } from '../models/Clock.model';
import { UserModel } from '../models/User.model';
import { TeamModel } from '../models/Team.model';
import type { TeamReport } from '../types/clock';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/reports
 * Get global reports based on chosen KPIs
 * Accessible by managers only
 * Query parameters:
 * - type: 'daily' | 'weekly' | 'team' (default: 'team')
 * - start_date: ISO date string (default: 30 days ago)
 * - end_date: ISO date string (default: today)
 * - team_id: team ID (optional, defaults to manager's team)
 */
router.get(
  '/',
  requireManager,
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      // Get teams managed by this manager
      const managedTeams = await TeamModel.findByManagerId(req.user.id);

      if (!managedTeams || managedTeams.length === 0) {
        res.status(400).json({ error: 'Manager not assigned to any team' });
        return;
      }

      // Parse query parameters
      const type = (req.query.type as string) || 'team';
      const teamIdParam = req.query.team_id ? parseInt(req.query.team_id as string) : null;

      // Determine which team to report on (default to first managed team)
      const teamId = teamIdParam || managedTeams[0].id;

      // Verify manager has access to this team
      const hasAccess = managedTeams.some(t => t.id === teamId);
      if (!hasAccess) {
        res.status(403).json({ error: 'Access forbidden: You can only view reports for your teams' });
        return;
      }

      // Get team details
      const team = await TeamModel.findById(teamId);

      if (!team) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }

      // Get team members (employees only)
      const allMembers = await TeamModel.getMembers(teamId);
      const employees = allMembers.filter(member => member.role === 'Employé');
      const userIds = employees.map(emp => emp.id);

      if (userIds.length === 0) {
        res.status(200).json({
          team: {
            id: team.id,
            name: team.name,
            description: team.description
          },
          period: {
            start: null,
            end: null
          },
          summary: {
            total_employees: 0,
            total_hours: 0,
            average_hours_per_employee: 0
          },
          reports: []
        });
        return;
      }

      // Parse dates
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const startDate = req.query.start_date
        ? new Date(req.query.start_date as string)
        : defaultStartDate;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

      // Validate dates
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        res.status(400).json({ error: 'Invalid date format' });
        return;
      }

      if (startDate > endDate) {
        res.status(400).json({ error: 'Start date must be before end date' });
        return;
      }

      // Generate reports based on type
      let reports: any[] = [];

      if (type === 'daily') {
        reports = await ClockModel.getDailyReports(userIds, startDate, endDate);
      } else if (type === 'weekly') {
        reports = await ClockModel.getWeeklyReports(userIds, startDate, endDate);
      } else if (type === 'team') {
        // Team report includes both daily and summary
        const dailyReports = await ClockModel.getDailyReports(userIds, startDate, endDate);
        const weeklyReports = await ClockModel.getWeeklyReports(userIds, startDate, endDate);
        const advancedKPIs = await ClockModel.getAdvancedKPIs(userIds, startDate, endDate);

        const totalHours = dailyReports.reduce((sum, report) => sum + report.hours_worked, 0);

        const teamReport: TeamReport = {
          team_id: team.id,
          team_name: team.name,
          period_start: startDate.toISOString(),
          period_end: endDate.toISOString(),
          total_employees: employees.length,
          total_hours: parseFloat(totalHours.toFixed(2)),
          average_hours_per_employee: parseFloat(
            (totalHours / employees.length).toFixed(2)
          ),
          daily_reports: dailyReports,
          weekly_reports: weeklyReports,
          advanced_kpis: advancedKPIs
        };

        res.status(200).json(teamReport);
        return;
      } else {
        res.status(400).json({ error: 'Invalid report type. Must be: daily, weekly, or team' });
        return;
      }

      // Calculate summary for daily and weekly reports
      const totalHours = reports.reduce((sum: number, report: any) => {
        if (type === 'daily') {
          return sum + report.hours_worked;
        } else if (type === 'weekly') {
          return sum + report.total_hours;
        }
        return sum;
      }, 0);

      res.status(200).json({
        team: {
          id: team.id,
          name: team.name,
          description: team.description
        },
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        type,
        summary: {
          total_employees: employees.length,
          total_hours: parseFloat(totalHours.toFixed(2)),
          average_hours_per_employee: parseFloat(
            (totalHours / employees.length).toFixed(2)
          )
        },
        reports
      });
    } catch (error) {
      console.error('Get reports error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/reports/employee/:id
 * Get individual employee report
 * Accessible by:
 * - The employee themselves
 * - Their manager
 */
router.get(
  '/employee/:id',
  async (req: AuthRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const employeeId = parseInt(req.params.id);

      if (isNaN(employeeId)) {
        res.status(400).json({ error: 'Invalid employee ID' });
        return;
      }

      // Get employee
      const employee = await UserModel.findById(employeeId);

      if (!employee) {
        res.status(404).json({ error: 'Employee not found' });
        return;
      }

      // Authorization check
      const currentUser = await UserModel.findById(req.user.id);

      if (!currentUser) {
        res.status(404).json({ error: 'Current user not found' });
        return;
      }

      const isSelf = employeeId === req.user.id;
      const isManagerOfSameTeam =
        currentUser.role === 'Manager' &&
        currentUser.team_id &&
        currentUser.team_id === employee.team_id;

      if (!isSelf && !isManagerOfSameTeam) {
        res.status(403).json({
          error: 'Access forbidden: You can only view your own report or reports of your team members'
        });
        return;
      }

      // Parse dates
      const defaultStartDate = new Date();
      defaultStartDate.setDate(defaultStartDate.getDate() - 30);

      const startDate = req.query.start_date
        ? new Date(req.query.start_date as string)
        : defaultStartDate;
      const endDate = req.query.end_date ? new Date(req.query.end_date as string) : new Date();

      // Get reports
      const dailyReports = await ClockModel.getDailyReports([employeeId], startDate, endDate);
      const weeklyReports = await ClockModel.getWeeklyReports([employeeId], startDate, endDate);

      const totalHours = dailyReports.reduce((sum, report) => sum + report.hours_worked, 0);
      const daysWorked = dailyReports.filter(report => report.hours_worked > 0).length;

      res.status(200).json({
        employee: {
          id: employee.id,
          email: employee.email,
          first_name: employee.first_name,
          last_name: employee.last_name,
          role: employee.role
        },
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        summary: {
          total_hours: parseFloat(totalHours.toFixed(2)),
          days_worked: daysWorked,
          average_daily_hours: daysWorked > 0 ? parseFloat((totalHours / daysWorked).toFixed(2)) : 0
        },
        daily_reports: dailyReports,
        weekly_reports: weeklyReports
      });
    } catch (error) {
      console.error('Get employee report error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
