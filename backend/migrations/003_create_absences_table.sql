-- Migration: Create absences table
-- This migration creates a dedicated table for absences, separate from clocks

-- Create absences table
CREATE TABLE IF NOT EXISTS absences (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type VARCHAR(50) DEFAULT 'other',
  reason TEXT,
  approved BOOLEAN DEFAULT false,
  approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Create indexes for better performance
CREATE INDEX idx_absences_user_id ON absences(user_id);
CREATE INDEX idx_absences_date ON absences(date);
CREATE INDEX idx_absences_user_date ON absences(user_id, date);

-- Migrate existing absences from clocks table
INSERT INTO absences (user_id, date, type, created_at)
SELECT
  user_id,
  DATE(clock_time) as date,
  'other' as type,
  created_at
FROM clocks
WHERE status = 'absent'
ON CONFLICT (user_id, date) DO NOTHING;

-- Remove absent status from clocks table (optional - uncomment if you want to clean up)
-- DELETE FROM clocks WHERE status = 'absent';

-- Update clock status constraint to only allow 'check-in' and 'check-out'
-- Note: This is commented out to avoid breaking existing data
-- ALTER TABLE clocks DROP CONSTRAINT IF EXISTS clocks_status_check;
-- ALTER TABLE clocks ADD CONSTRAINT clocks_status_check CHECK (status IN ('check-in', 'check-out'));
