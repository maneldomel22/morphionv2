/*
  # Add name fields to profiles table

  1. Changes
    - Add `first_name` column to profiles table
    - Add `last_name` column to profiles table
    - Both fields are nullable to support existing users

  2. Purpose
    - Store user's first and last name separately
    - Required for new signup flow
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'first_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN first_name text;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'last_name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN last_name text;
  END IF;
END $$;