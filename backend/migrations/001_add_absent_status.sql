-- Migration: Add 'absent' status to clocks table
-- Date: 2025-10-16
-- Description: Adds the 'absent' status option to the existing clocks table

-- Step 1: Drop the existing constraint
ALTER TABLE clocks DROP CONSTRAINT IF EXISTS clocks_status_check;

-- Step 2: Add the new constraint with 'absent' included
ALTER TABLE clocks
  ADD CONSTRAINT clocks_status_check
  CHECK (status IN ('check-in', 'check-out', 'absent'));

-- Step 3: Add comment to document the change
COMMENT ON COLUMN clocks.status IS 'Clock status: check-in (employee arrival), check-out (employee departure), or absent (full day absence)';
