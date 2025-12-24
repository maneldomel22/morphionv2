/*
  # Add Safe View Preference

  1. Changes
    - Add `safe_view_enabled` column to `profiles` table to store user preference
    - Default is `true` (safe view enabled by default)
  
  2. Security
    - Users can only update their own safe view preference
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'safe_view_enabled'
  ) THEN
    ALTER TABLE profiles ADD COLUMN safe_view_enabled boolean DEFAULT true;
  END IF;
END $$;