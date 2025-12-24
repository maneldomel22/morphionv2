/*
  # Add updated_at column to videos table

  1. Changes
    - Add `updated_at` column to videos table with default value of now()
    - This column is used by edge functions to track when videos are last modified
  
  2. Notes
    - The column will be automatically set to the current timestamp when the row is updated
    - Existing rows will have updated_at set to their created_at value initially
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE videos ADD COLUMN updated_at timestamptz DEFAULT now();
    
    -- Set initial value for existing rows to match created_at
    UPDATE videos SET updated_at = created_at WHERE updated_at IS NULL;
  END IF;
END $$;
