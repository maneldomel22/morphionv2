/*
  # Revert Variation System Changes

  1. Data Updates
    - Update existing videos with source_mode='variation' to 'sora'
    
  2. Schema Changes
    - Remove 'variation' from source_mode check constraint
    - Drop base_prompt column from videos table
    - Drop base_dialogue column from videos table

  3. Purpose
    - Clean up database schema from removed variation functionality
    - Preserve existing variation videos by converting them to standard videos
*/

-- First, update existing variation videos to use 'sora' source_mode
UPDATE videos 
SET source_mode = 'sora' 
WHERE source_mode = 'variation';

-- Remove base_prompt and base_dialogue columns
ALTER TABLE videos
DROP COLUMN IF EXISTS base_prompt,
DROP COLUMN IF EXISTS base_dialogue;

-- Drop existing constraint
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_source_mode_check;

-- Recreate constraint without 'variation'
ALTER TABLE videos ADD CONSTRAINT videos_source_mode_check
  CHECK (source_mode IN ('influencer', 'editor', 'sora', 'autopilot', 'manual'));