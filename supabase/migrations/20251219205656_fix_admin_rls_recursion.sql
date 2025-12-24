/*
  # Fix Admin RLS Recursion Issue

  1. Problem
    - The `is_admin()` function queries the `admins` table
    - The `admins` table RLS policy requires `is_admin()` to return true for SELECT
    - This creates a circular dependency that blocks all admin checks

  2. Solution
    - Drop the recursive policy that calls `is_admin()`
    - Create a new policy that allows authenticated users to check their own admin status
    - This breaks the circular dependency while maintaining security

  3. Security
    - Users can only check if THEY are admin (id = auth.uid())
    - This is safe and necessary for the admin panel to function
    - The function can still be used in OTHER tables without recursion issues
*/

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admins can view all admin records" ON admins;
DROP POLICY IF EXISTS "Admins can insert admin records" ON admins;
DROP POLICY IF EXISTS "Admins can delete admin records" ON admins;

-- Allow authenticated users to check their own admin status (no recursion)
CREATE POLICY "Users can check their own admin status"
  ON admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());

-- Only existing admins can insert new admin records
CREATE POLICY "Admins can insert new admins"
  ON admins
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE id = auth.uid()
    )
  );

-- Only existing admins can delete admin records
CREATE POLICY "Admins can delete admins"
  ON admins
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE id = auth.uid()
    )
  );
