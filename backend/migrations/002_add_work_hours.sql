-- Migration: Add work hours to users table
-- Date: 2025-10-16
-- Description: Adds work_start_time and work_end_time columns to users table for fixed work schedules

-- Add work hours columns with default 8h-17h
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '08:00:00',
  ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00:00';

-- Add comments to document the columns
COMMENT ON COLUMN users.work_start_time IS 'Expected start time of work (default 08:00:00)';
COMMENT ON COLUMN users.work_end_time IS 'Expected end time of work (default 17:00:00)';
