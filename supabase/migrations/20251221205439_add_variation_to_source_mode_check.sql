/*
  # Add 'variation' to source_mode check constraint

  1. Changes
    - Drop existing videos_source_mode_check constraint
    - Recreate with 'variation' added to allowed values

  2. Updated allowed values
    - influencer
    - editor
    - sora
    - autopilot
    - manual
    - variation (NEW)

  3. Purpose
    - Allow videos created from variation generation to be properly tracked
    - Fix constraint violation error when generating video variations
*/

-- Drop existing constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_source_mode_check;

-- Add new constraint with 'variation' included
ALTER TABLE videos ADD CONSTRAINT videos_source_mode_check
  CHECK (source_mode IN ('influencer', 'editor', 'sora', 'autopilot', 'manual', 'variation'));
