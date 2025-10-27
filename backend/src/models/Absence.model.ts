import { QueryResult } from 'pg';
import pool from '../config/database';
import type { Absence, AbsenceCreate, AbsenceUpdate } from '../types/absence';

export class AbsenceModel {
  /**
   * Create a new absence entry
   */
  static async create(userId: number, absenceData: AbsenceCreate): Promise<Absence> {
    const { date, type = 'other', reason } = absenceData;

    const result: QueryResult<Absence> = await pool.query(
      `INSERT INTO absences (user_id, date, type, reason)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (user_id, date)
       DO UPDATE SET type = EXCLUDED.type, reason = EXCLUDED.reason, updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [userId, date, type, reason]
    );

    return result.rows[0];
  }

  /**
   * Get absence by ID
   */
  static async findById(id: number): Promise<Absence | null> {
    const result: QueryResult<Absence> = await pool.query(
      'SELECT * FROM absences WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all absences for a user
   */
  static async findByUserId(
    userId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<Absence[]> {
    let query = 'SELECT * FROM absences WHERE user_id = $1';
    const params: any[] = [userId];

    if (startDate) {
      params.push(startDate.toISOString().split('T')[0]);
      query += ` AND date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString().split('T')[0]);
      query += ` AND date <= $${params.length}`;
    }

    query += ' ORDER BY date DESC';

    const result: QueryResult<Absence> = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Get absences for multiple users (for team reports)
   */
  static async findByUserIds(
    userIds: number[],
    startDate?: Date,
    endDate?: Date
  ): Promise<Absence[]> {
    let query = 'SELECT * FROM absences WHERE user_id = ANY($1)';
    const params: any[] = [userIds];

    if (startDate) {
      params.push(startDate.toISOString().split('T')[0]);
      query += ` AND date >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate.toISOString().split('T')[0]);
      query += ` AND date <= $${params.length}`;
    }

    query += ' ORDER BY date DESC, user_id ASC';

    const result: QueryResult<Absence> = await pool.query(query, params);
    return result.rows;
  }

  /**
   * Check if user has absence on a specific date
   */
  static async hasAbsenceOnDate(userId: number, date: string): Promise<boolean> {
    const result: QueryResult = await pool.query(
      'SELECT id FROM absences WHERE user_id = $1 AND date = $2',
      [userId, date]
    );

    return result.rows.length > 0;
  }

  /**
   * Update an absence
   */
  static async update(id: number, updateData: AbsenceUpdate): Promise<Absence | null> {
    const { type, reason, approved, approved_by } = updateData;
    const updates: string[] = [];
    const params: any[] = [];
    let paramCount = 1;

    if (type !== undefined) {
      updates.push(`type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (reason !== undefined) {
      updates.push(`reason = $${paramCount}`);
      params.push(reason);
      paramCount++;
    }

    if (approved !== undefined) {
      updates.push(`approved = $${paramCount}`);
      params.push(approved);
      paramCount++;
    }

    if (approved_by !== undefined) {
      updates.push(`approved_by = $${paramCount}`);
      params.push(approved_by);
      paramCount++;
    }

    if (updates.length === 0) {
      return this.findById(id);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE absences
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result: QueryResult<Absence> = await pool.query(query, params);
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Approve an absence (Manager only)
   */
  static async approve(id: number, managerId: number): Promise<Absence | null> {
    const result: QueryResult<Absence> = await pool.query(
      `UPDATE absences
       SET approved = true, approved_by = $2, status = 'approved', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, managerId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Reject an absence (Manager only)
   * Sets the absence status to 'rejected'
   */
  static async reject(id: number, managerId: number): Promise<Absence | null> {
    const result: QueryResult<Absence> = await pool.query(
      `UPDATE absences
       SET approved = false, approved_by = $2, status = 'rejected', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1
       RETURNING *`,
      [id, managerId]
    );
    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete an absence
   */
  static async delete(id: number): Promise<boolean> {
    const result: QueryResult = await pool.query('DELETE FROM absences WHERE id = $1', [id]);
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Delete absence by user and date
   */
  static async deleteByUserAndDate(userId: number, date: string): Promise<boolean> {
    const result: QueryResult = await pool.query(
      'DELETE FROM absences WHERE user_id = $1 AND date = $2',
      [userId, date]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Detect days without clocks or absences (potential absent days)
   */
  static async detectPotentialAbsences(
    userId: number,
    startDate: Date,
    endDate: Date
  ): Promise<string[]> {
    const query = `
      WITH date_series AS (
        SELECT generate_series(
          $2::date,
          $3::date,
          '1 day'::interval
        )::date AS date
      ),
      workdays AS (
        SELECT date
        FROM date_series
        WHERE EXTRACT(DOW FROM date) NOT IN (0, 6) -- Exclude weekends
      ),
      clocked_days AS (
        SELECT DISTINCT DATE(clock_time) as date
        FROM clocks
        WHERE user_id = $1
          AND clock_time >= $2
          AND clock_time <= $3
      ),
      absent_days AS (
        SELECT date
        FROM absences
        WHERE user_id = $1
          AND date >= $2
          AND date <= $3
      )
      SELECT w.date::text
      FROM workdays w
      LEFT JOIN clocked_days c ON w.date = c.date
      LEFT JOIN absent_days a ON w.date = a.date
      WHERE c.date IS NULL
        AND a.date IS NULL
        AND w.date < CURRENT_DATE
      ORDER BY w.date DESC
    `;

    const result = await pool.query(query, [userId, startDate, endDate]);
    return result.rows.map(row => row.date);
  }

  /**
   * Get absence statistics for a user
   */
  static async getStats(userId: number, startDate: Date, endDate: Date) {
    const absences = await this.findByUserId(userId, startDate, endDate);

    return {
      total: absences.length,
      by_type: {
        sick: absences.filter(a => a.type === 'sick').length,
        vacation: absences.filter(a => a.type === 'vacation').length,
        personal: absences.filter(a => a.type === 'personal').length,
        other: absences.filter(a => a.type === 'other').length,
      },
      approved: absences.filter(a => a.status === 'approved').length,
      pending: absences.filter(a => a.status === 'pending').length,
      rejected: absences.filter(a => a.status === 'rejected').length,
    };
  }
}
