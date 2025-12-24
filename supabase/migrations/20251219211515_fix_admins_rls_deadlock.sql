/*
  # Fix Admins Table RLS Deadlock

  1. Problem
    - Current RLS policies create circular dependency
    - Users need to be admin to check if they're admin
    - This causes queries to hang indefinitely

  2. Solution
    - Drop existing circular policies
    - Allow authenticated users to check if THEY are admin
    - Prevent users from seeing other admins
    - Maintain security while fixing deadlock

  3. Security
    - Users can only check their own admin status
    - Users cannot list all admins
    - Only existing admins can modify the admins table
*/

-- Drop the problematic circular policies
DROP POLICY IF EXISTS "Only admins can view admins" ON admins;
DROP POLICY IF EXISTS "Only admins can insert admins" ON admins;
DROP POLICY IF EXISTS "Only admins can delete admins" ON admins;

-- Allow users to check if THEY are an admin (no circular dependency)
CREATE POLICY "Users can check their own admin status"
  ON admins FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Only existing admins can insert new admins (checked via service role or function)
-- This policy will only work for users already in the admins table
CREATE POLICY "Admins can insert new admins"
  ON admins FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Only existing admins can delete admins
CREATE POLICY "Admins can delete admins"
  ON admins FOR DELETE
  TO authenticated
  USING (
    auth.uid() IN (SELECT id FROM admins)
  );

-- Create a helper function for safe admin check (optional, for use in other policies)
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE id = user_id
  );
$$;
