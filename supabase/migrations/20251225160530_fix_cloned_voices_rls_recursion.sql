/*
  # Fix RLS Recursion in Cloned Voices Table

  1. Problem
    - Multiple duplicate policies causing conflicts
    - INSERT policy with subquery causing infinite recursion
    - Policy checking count from same table creates circular dependency

  2. Solution
    - Drop all existing policies
    - Recreate clean, simple policies without recursion
    - Remove the voice limit check that causes recursion

  3. Changes
    - Remove all policies from cloned_voices table
    - Create simplified policies without circular dependencies
    - Ensure each policy only checks auth.uid() directly
*/

-- Drop all existing policies on cloned_voices
DROP POLICY IF EXISTS "Admins can view all voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can view own voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can view own cloned voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can insert own voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can insert own cloned voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can update own voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can update own cloned voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can delete own voices" ON cloned_voices;
DROP POLICY IF EXISTS "Users can delete own cloned voices" ON cloned_voices;

-- Create clean, simple policies without recursion
CREATE POLICY "Users can view their own cloned voices"
  ON cloned_voices FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own cloned voices"
  ON cloned_voices FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cloned voices"
  ON cloned_voices FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cloned voices"
  ON cloned_voices FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
