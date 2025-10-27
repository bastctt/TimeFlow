import pool from '../config/database';
import crypto from 'crypto';

interface PasswordResetToken {
  id: number;
  user_id: number;
  token_hash: string;
  expires_at: Date;
  used: boolean;
  created_at: Date;
}

interface CreateTokenResult {
  token: string; // Plain token to send via email
  tokenHash: string; // Hashed token to store in DB
  expiresAt: Date;
}

export class PasswordResetTokenModel {
  /**
   * Generate a secure random token
   */
  static generateToken(): CreateTokenResult {
    // Generate a secure random token (32 bytes = 64 hex characters)
    const token = crypto.randomBytes(32).toString('hex');

    // Hash the token before storing in database
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Token expires in 24 hours
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return { token, tokenHash, expiresAt };
  }

  /**
   * Create a new password reset token for a user
   */
  static async create(userId: number): Promise<CreateTokenResult> {
    const { token, tokenHash, expiresAt } = this.generateToken();

    // Invalidate any existing tokens for this user
    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE user_id = $1 AND used = false',
      [userId]
    );

    // Insert new token
    await pool.query(
      `INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, $3)`,
      [userId, tokenHash, expiresAt]
    );

    // Return the plain token (to be sent via email)
    return { token, tokenHash, expiresAt };
  }

  /**
   * Verify a reset token and return the associated user_id if valid
   */
  static async verify(token: string): Promise<number | null> {
    // Hash the provided token to compare with stored hash
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const result = await pool.query<PasswordResetToken>(
      `SELECT * FROM password_reset_tokens
       WHERE token_hash = $1
       AND used = false
       AND expires_at > NOW()
       ORDER BY created_at DESC
       LIMIT 1`,
      [tokenHash]
    );

    if (result.rows.length === 0) {
      return null;
    }

    return result.rows[0].user_id;
  }

  /**
   * Mark a token as used after successful password reset
   */
  static async markAsUsed(token: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token_hash = $1',
      [tokenHash]
    );
  }

  /**
   * Clean up expired tokens (can be run periodically)
   */
  static async cleanupExpired(): Promise<number> {
    const result = await pool.query(
      'DELETE FROM password_reset_tokens WHERE expires_at < NOW() OR used = true',
    );

    return result.rowCount || 0;
  }

  /**
   * Delete all tokens for a specific user
   */
  static async deleteAllForUser(userId: number): Promise<void> {
    await pool.query(
      'DELETE FROM password_reset_tokens WHERE user_id = $1',
      [userId]
    );
  }
}
