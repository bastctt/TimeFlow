-- Migration: Add status column to absences table
-- This migration adds a status column to track 'pending', 'approved', and 'rejected' states

-- Add status column with default 'pending'
ALTER TABLE absences
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'));

-- Migrate existing data based on approved boolean
-- If approved = true, set status to 'approved', otherwise 'pending'
UPDATE absences
SET status = CASE
  WHEN approved = true THEN 'approved'
  ELSE 'pending'
END
WHERE status = 'pending';

-- Create index for better performance on status queries
CREATE INDEX IF NOT EXISTS idx_absences_status ON absences(status);

-- Note: We keep the approved column for backward compatibility
-- It will be updated by triggers or application logic
