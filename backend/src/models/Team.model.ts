import { QueryResult } from 'pg';
import pool from '../config/database';
import type { Team, TeamCreate, TeamUpdate } from '../types/team';

export class TeamModel {
  /**
   * Find a team by ID
   */
  static async findById(id: number): Promise<Team | null> {
    const result: QueryResult<Team> = await pool.query(
      'SELECT * FROM teams WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Get all teams
   */
  static async findAll(): Promise<Team[]> {
    const result: QueryResult<Team> = await pool.query(
      'SELECT * FROM teams ORDER BY name ASC'
    );

    return result.rows;
  }

  /**
   * Find teams by manager ID
   */
  static async findByManagerId(managerId: number): Promise<Team[]> {
    const result: QueryResult<Team> = await pool.query(
      'SELECT * FROM teams WHERE manager_id = $1 ORDER BY name ASC',
      [managerId]
    );

    return result.rows;
  }

  /**
   * Create a new team
   */
  static async create(teamData: TeamCreate): Promise<Team> {
    const { name, description, manager_id } = teamData;

    const result: QueryResult<Team> = await pool.query(
      'INSERT INTO teams (name, description, manager_id) VALUES ($1, $2, $3) RETURNING *',
      [name, description || null, manager_id]
    );

    return result.rows[0];
  }

  /**
   * Update a team
   */
  static async update(id: number, teamData: TeamUpdate): Promise<Team | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (teamData.name !== undefined) {
      fields.push(`name = $${paramIndex++}`);
      values.push(teamData.name);
    }
    if (teamData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(teamData.description);
    }
    if (teamData.manager_id !== undefined) {
      fields.push(`manager_id = $${paramIndex++}`);
      values.push(teamData.manager_id);
    }

    if (fields.length === 0) {
      return null;
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result: QueryResult<Team> = await pool.query(
      `UPDATE teams SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete a team
   */
  static async delete(id: number): Promise<boolean> {
    const result: QueryResult = await pool.query(
      'DELETE FROM teams WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get team members (users in the team)
   */
  static async getMembers(teamId: number): Promise<any[]> {
    const result: QueryResult = await pool.query(
      'SELECT id, email, first_name, last_name, role FROM users WHERE team_id = $1 ORDER BY role DESC, last_name ASC',
      [teamId]
    );

    return result.rows;
  }
}
