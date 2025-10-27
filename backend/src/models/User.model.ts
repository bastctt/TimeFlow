import { QueryResult } from 'pg';
import bcrypt from 'bcrypt';
import pool from '../config/database';
import type { User, UserRegistration, UserResponse } from '../types/user';

export class UserModel {
  /**
   * Find a user by email
   */
  static async findByEmail(email: string): Promise<User | null> {
    const result: QueryResult<User> = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, team_id FROM users WHERE email = $1',
      [email]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Find a user by ID
   */
  static async findById(id: number): Promise<User | null> {
    const result: QueryResult<User> = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, team_id FROM users WHERE id = $1',
      [id]
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Create a new user
   */
  static async create(userData: UserRegistration): Promise<User> {
    const { email, password, first_name, last_name, role } = userData;

    // Hash password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const result: QueryResult<User> = await pool.query(
      'INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, password_hash, first_name, last_name, role, team_id',
      [email, password_hash, first_name, last_name, role]
    );

    return result.rows[0];
  }

  /**
   * Update user information
   */
  static async update(id: number, userData: Partial<Omit<User, 'id' | 'password_hash'>>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.email) {
      fields.push(`email = $${paramIndex++}`);
      values.push(userData.email);
    }
    if (userData.first_name) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.first_name);
    }
    if (userData.last_name) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.last_name);
    }
    if (userData.role) {
      fields.push(`role = $${paramIndex++}`);
      values.push(userData.role);
    }
    if (userData.team_id !== undefined) {
      fields.push(`team_id = $${paramIndex++}`);
      values.push(userData.team_id);
    }

    if (fields.length === 0) {
      return null;
    }

    values.push(id);

    const result: QueryResult<User> = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING id, email, password_hash, first_name, last_name, role, team_id`,
      values
    );

    return result.rows.length > 0 ? result.rows[0] : null;
  }

  /**
   * Delete a user
   */
  static async delete(id: number): Promise<boolean> {
    const result: QueryResult = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Get all users
   */
  static async findAll(): Promise<User[]> {
    const result: QueryResult<User> = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, team_id FROM users'
    );

    return result.rows;
  }

  /**
   * Find users by role
   */
  static async findByRole(role: 'Manager' | 'Employé'): Promise<User[]> {
    const result: QueryResult<User> = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, team_id FROM users WHERE role = $1',
      [role]
    );

    return result.rows;
  }

  /**
   * Find users by team IDs
   */
  static async findByTeamIds(teamIds: number[]): Promise<User[]> {
    const result: QueryResult<User> = await pool.query(
      'SELECT id, email, password_hash, first_name, last_name, role, team_id FROM users WHERE team_id = ANY($1)',
      [teamIds]
    );

    return result.rows;
  }

  /**
   * Verify password
   */
  static async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password_hash);
  }

  /**
   * Update user password
   */
  static async updatePassword(id: number, newPassword: string): Promise<boolean> {
    // Hash new password
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(newPassword, saltRounds);

    const result: QueryResult = await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [password_hash, id]
    );

    return result.rowCount !== null && result.rowCount > 0;
  }

  /**
   * Convert User to UserResponse (removes password_hash)
   */
  static toResponse(user: User): UserResponse {
    return {
      id: user.id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role
    };
  }
}
