import { QueryResult } from 'pg';
import pool from '../config/database';
import type { Clock, ClockCreate, WorkingHours, DailyReport, WeeklyReport, AdvancedKPIs } from '../types/clock';

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
      hours_worked: row.hours_worked != null ? parseFloat(Number(row.hours_worked).toFixed(2)) : 0
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
      WITH daily_hours AS (
        SELECT
          u.id as user_id,
          u.first_name,
          u.last_name,
          u.email,
          DATE(c.clock_time) as work_date,
          DATE_TRUNC('week', c.clock_time)::date as week_start,
          COALESCE(
            EXTRACT(EPOCH FROM (
              MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) -
              MIN(CASE WHEN c.status = 'check-in' THEN c.clock_time END)
            )) / 3600,
            0
          ) as daily_hours
        FROM users u
        LEFT JOIN clocks c ON u.id = c.user_id
          AND c.clock_time >= $2
          AND c.clock_time <= $3
        WHERE u.id = ANY($1)
        GROUP BY u.id, u.first_name, u.last_name, u.email, DATE(c.clock_time), DATE_TRUNC('week', c.clock_time)
      )
      SELECT
        user_id,
        first_name,
        last_name,
        email,
        week_start,
        (week_start + INTERVAL '6 days')::date as week_end,
        COALESCE(SUM(daily_hours), 0) as total_hours,
        COUNT(DISTINCT work_date) as days_worked
      FROM daily_hours
      GROUP BY user_id, first_name, last_name, email, week_start
      ORDER BY week_start DESC, last_name ASC
    `;

    const result: QueryResult = await pool.query(query, [userIds, startDate, endDate]);

    return result.rows.map(row => ({
      user_id: row.user_id,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      week_start: row.week_start,
      week_end: row.week_end,
      total_hours: row.total_hours != null ? parseFloat(Number(row.total_hours).toFixed(2)) : 0,
      average_daily_hours: row.days_worked > 0
        ? parseFloat((Number(row.total_hours) / row.days_worked).toFixed(2))
        : 0,
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

  /**
   * Calculate advanced KPIs for team
   */
  static async getAdvancedKPIs(
    userIds: number[],
    startDate: Date,
    endDate: Date
  ): Promise<AdvancedKPIs> {
    // Calculate number of workdays (Monday-Friday) in period
    const workdays = this.calculateWorkdays(startDate, endDate);

    // Get all check-ins in the period
    const checkInsQuery = `
      SELECT
        c.clock_time,
        c.user_id,
        DATE(c.clock_time) as date
      FROM clocks c
      WHERE c.user_id = ANY($1)
        AND c.clock_time >= $2
        AND c.clock_time <= $3
        AND c.status = 'check-in'
      ORDER BY c.clock_time ASC
    `;

    const checkInsResult = await pool.query(checkInsQuery, [userIds, startDate, endDate]);
    const checkIns = checkInsResult.rows;

    // Get employees currently clocked in (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const activeTodayQuery = `
      WITH latest_clocks AS (
        SELECT DISTINCT ON (user_id) user_id, status, clock_time
        FROM clocks
        WHERE user_id = ANY($1)
          AND clock_time >= $2
          AND clock_time < $3
        ORDER BY user_id, clock_time DESC
      )
      SELECT COUNT(*) as count
      FROM latest_clocks
      WHERE status = 'check-in'
    `;

    const activeTodayResult = await pool.query(activeTodayQuery, [userIds, today, tomorrow]);
    const activeEmployeesToday = parseInt(activeTodayResult.rows[0]?.count || '0');

    // Calculate average check-in time
    let averageCheckInTime: string | null = null;
    if (checkIns.length > 0) {
      const totalMinutes = checkIns.reduce((sum: number, row: any) => {
        const time = new Date(row.clock_time);
        return sum + (time.getHours() * 60 + time.getMinutes());
      }, 0);
      const avgMinutes = Math.round(totalMinutes / checkIns.length);
      const hours = Math.floor(avgMinutes / 60);
      const minutes = avgMinutes % 60;
      averageCheckInTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Calculate punctuality rate (check-ins before 9:30 AM)
    const punctualCheckIns = checkIns.filter((row: any) => {
      const time = new Date(row.clock_time);
      const hour = time.getHours();
      const minute = time.getMinutes();
      return hour < 9 || (hour === 9 && minute <= 30);
    }).length;

    const punctualityRate = checkIns.length > 0
      ? parseFloat(((punctualCheckIns / checkIns.length) * 100).toFixed(2))
      : 0;

    const lateArrivals = checkIns.length - punctualCheckIns;

    // Get daily working hours for overtime calculation
    const dailyHoursQuery = `
      SELECT
        DATE(c.clock_time) as date,
        COALESCE(
          EXTRACT(EPOCH FROM (
            MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) -
            MIN(CASE WHEN c.status = 'check-in' THEN c.clock_time END)
          )) / 3600,
          0
        ) as hours_worked
      FROM clocks c
      WHERE c.user_id = ANY($1)
        AND c.clock_time >= $2
        AND c.clock_time <= $3
      GROUP BY DATE(c.clock_time)
      HAVING MAX(CASE WHEN c.status = 'check-out' THEN c.clock_time END) IS NOT NULL
    `;

    const dailyHoursResult = await pool.query(dailyHoursQuery, [userIds, startDate, endDate]);

    // Calculate overtime (hours beyond 8 per day)
    const overtimeHours = dailyHoursResult.rows.reduce((sum: number, row: any) => {
      const hoursWorked = parseFloat(row.hours_worked);
      return sum + Math.max(0, hoursWorked - 8);
    }, 0);

    // Calculate unique dates worked
    const uniqueDatesQuery = `
      SELECT COUNT(DISTINCT DATE(c.clock_time)) as count
      FROM clocks c
      WHERE c.user_id = ANY($1)
        AND c.clock_time >= $2
        AND c.clock_time <= $3
    `;

    const uniqueDatesResult = await pool.query(uniqueDatesQuery, [userIds, startDate, endDate]);
    const totalDaysWorked = parseInt(uniqueDatesResult.rows[0]?.count || '0');

    // Calculate attendance rate
    const attendanceRate = workdays > 0
      ? parseFloat(((totalDaysWorked / (workdays * userIds.length)) * 100).toFixed(2))
      : 0;

    return {
      attendance_rate: attendanceRate,
      active_employees_today: activeEmployeesToday,
      average_check_in_time: averageCheckInTime,
      punctuality_rate: punctualityRate,
      overtime_hours: parseFloat(overtimeHours.toFixed(2)),
      total_workdays: workdays,
      total_days_worked: totalDaysWorked,
      late_arrivals: lateArrivals
    };
  }

  /**
   * Calculate number of workdays (Monday-Friday) between two dates
   */
  private static calculateWorkdays(startDate: Date, endDate: Date): number {
    let count = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay();
      // 0 = Sunday, 6 = Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }
}
