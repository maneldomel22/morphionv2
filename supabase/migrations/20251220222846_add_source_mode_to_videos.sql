/*
  # Add source_mode to videos table

  1. Changes
    - Add `source_mode` column to videos table
      - Type: text
      - Default: 'manual'
      - Values: influencer | editor | sora | autopilot | manual
    - Add index on source_mode for better query performance

  2. Purpose
    - Track the context where videos were created
    - Enable filtering videos by creation source
    - Support the "engine nasce na criação" principle
*/

-- Add source_mode column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'source_mode'
  ) THEN
    ALTER TABLE videos ADD COLUMN source_mode text DEFAULT 'manual';
  END IF;
END $$;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_videos_source_mode ON videos(source_mode);

-- Add check constraint to ensure only valid values
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'videos_source_mode_check'
  ) THEN
    ALTER TABLE videos ADD CONSTRAINT videos_source_mode_check
      CHECK (source_mode IN ('influencer', 'editor', 'sora', 'autopilot', 'manual'));
  END IF;
END $$;
