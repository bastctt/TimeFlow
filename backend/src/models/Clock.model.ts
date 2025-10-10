import { QueryResult } from 'pg';
import pool from '../config/database';
import type { Clock, ClockCreate, WorkingHours, DailyReport, WeeklyReport } from '../types/clock';

export class ClockModel {
  /**
   * Create a new clock entry (check-in or check-out)
   */
  static async create(userId: number, clockData: ClockCreate): Promise<Clock> {
    const { status, clock_time } = clockData;
    const clockTime = clock_time || new Date();

    const result: QueryResult<Clock> = await pool.query(
      'INSERT INTO clocks (user_id, clock_time, status) VALUES ($1, $2, $3) RETURNING *',
      [userId, clockTime, status]
    );

    return result.rows[0];
  }

  /**
   * Get the last clock entry for a user
   */
  static async getLastClock(userId: number): Promise<Clock | null> {
    const result: QueryResult<Clock> = await pool.query(
      'SELECT * FROM clocks WHERE user_id = $1 ORDER BY clock_time DESC LIMIT 1',
      [userId]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all clock entries for a user
   */
  static async findByUserId(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Clock[]> {
    let query = 'SELECT * FROM clocks WHERE user_id = $1';
    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate);
      query += ` AND clock_time >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND clock_time <= $${params.length}`;
    }

    query += ' ORDER BY clock_time ASC';

    const result: QueryResult<Clock> = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get all clocks for multiple users (for team reports)
   */
  static async findByUserIds(
    userIds: number[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Clock[]> {
    let query = 'SELECT * FROM clocks WHERE user_id = ANY($1)';
    const params: any[] = [userIds];

    if (startDate) {
      params.push(startDate);
      query += ` AND clock_time >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      query += ` AND clock_time <= $${params.length}`;
    }

    query += ' ORDER BY user_id ASC, clock_time ASC';

    const result: QueryResult<Clock> = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Calculate working hours from clock pairs
   */
  static calculateWorkingHours(clocks: Clock[]): WorkingHours[] {
    const dayMap: { [date: string]: { checkIn: Date | null; checkOut: Date | null } } = {};

    // Group clocks by date
    for (const clock of clocks) {
      const date = new Date(clock.clock_time).toISOString().split('T')[0];

      if (!dayMap[date]) {
        dayMap[date] = { checkIn: null, checkOut: null };
      }

      if (clock.status === 'check-in') {
        // Take the first check-in of the day
        if (!dayMap[date].checkIn) {
          dayMap[date].checkIn = new Date(clock.clock_time);
        }
      } else if (clock.status === 'check-out') {
        // Take the last check-out of the day
        dayMap[date].checkOut = new Date(clock.clock_time);
      }
    }

    // Calculate hours for each day
    const workingHours: WorkingHours[] = [];

    for (const [date, times] of Object.entries(dayMap)) {
      let hoursWorked = 0;

      if (times.checkIn && times.checkOut) {
        const diffMs = times.checkOut.getTime() - times.checkIn.getTime();
        hoursWorked = diffMs / (1000 * 60 * 60); // Convert to hours
      }

      workingHours.push({
        date,
        check_in: times.checkIn,
        check_out: times.checkOut,
        hours_worked: parseFloat(hoursWorked.toFixed(2))
      });
    }

    return workingHours.sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate total hours worked
   */
  static calculateTotalHours(workingHours: WorkingHours[]): number {
    const total = workingHours.reduce((sum, day) => sum + day.hours_worked, 0);
    return parseFloat(total.toFixed(2));
  }

  /**
   * Get daily reports for users
   */
  static async getDailyReports(
    userIds: number[],
    startDate: Date,
    endDate: Date
  ): Promise<DailyReport[]> {
    const query = `
      SELECT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        DATE(c.clock_time) as date,
        MIN(CASE WHEN c.status = 'check-in' THEN c.clock_time END) as check_in,
        MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) as check_out,
        COALESCE(
          EXTRACT(EPOCH FROM (
            MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) -
            MIN(CASE WHEN c.status = 'check-in' THEN c.clock_time END)
          )) / 3600,
          0
        ) as hours_worked
      FROM users u
      LEFT JOIN clocks c ON u.id = c.user_id
        AND c.clock_time >= $2
        AND c.clock_time <= $3
      WHERE u.id = ANY($1)
      GROUP BY u.id, u.first_name, u.last_name, u.email, DATE(c.clock_time)
      ORDER BY date DESC, u.last_name ASC
    `;

    const result: QueryResult<DailyReport> = await pool.query(query, [
      userIds,
      startDate,
      endDate
    ]);

    return result.rows.map(row => ({
      ...row,
      hours_worked: parseFloat((row.hours_worked as any).toFixed(2))
    }));
  }

  /**
   * Get weekly reports for users
   */
  static async getWeeklyReports(
    userIds: number[],
    startDate: Date,
    endDate: Date
  ): Promise<WeeklyReport[]> {
    const query = `
      SELECT
        u.id as user_id,
        u.first_name,
        u.last_name,
        u.email,
        DATE_TRUNC('week', c.clock_time)::date as week_start,
        (DATE_TRUNC('week', c.clock_time) + INTERVAL '6 days')::date as week_end,
        COALESCE(SUM(
          EXTRACT(EPOCH FROM (
            MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) -
            MIN(CASE WHEN c.status = 'check-in' THEN c.clock_time END)
          )) / 3600
        ), 0) as total_hours,
        COUNT(DISTINCT DATE(c.clock_time)) as days_worked
      FROM users u
      LEFT JOIN clocks c ON u.id = c.user_id
        AND c.clock_time >= $2
        AND c.clock_time <= $3
      WHERE u.id = ANY($1)
      GROUP BY u.id, u.first_name, u.last_name, u.email, DATE_TRUNC('week', c.clock_time)
      ORDER BY week_start DESC, u.last_name ASC
    `;

    const result: QueryResult = await pool.query(query, [userIds, startDate, endDate]);

    return result.rows.map(row => ({
      user_id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      week_start: row.week_start,
      week_end: row.week_end,
      total_hours: parseFloat((row.total_hours as any).toFixed(2)),
      average_daily_hours: parseFloat(
        ((row.total_hours as any) / Math.max(row.days_worked, 1)).toFixed(2)
      ),
      days_worked: row.days_worked
    }));
  }

  /**
   * Delete a clock entry
   */
  static async delete(id: number): Promise<boolean> {
    const result: QueryResult = await pool.query('DELETE FROM clocks WHERE id = $1', [id]);

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Delete all clocks for a user
   */
  static async deleteByUserId(userId: number): Promise<boolean> {
    const result: QueryResult = await pool.query('DELETE FROM clocks WHERE user_id = $1', [
      userId
    ]);

    return result.rowCount !== null && result.rowCount > 0;
  }
}
