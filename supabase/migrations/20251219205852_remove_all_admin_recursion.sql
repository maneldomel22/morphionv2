/*
  # Remove All Recursion from Admin Policies

  1. Problem
    - INSERT and DELETE policies still query the admins table
    - This causes the same recursion issue when trying to manage admins
    
  2. Solution
    - Keep only the SELECT policy for checking own admin status
    - Remove INSERT/DELETE policies entirely (manage admins via SQL or functions)
    - This is safer and avoids all recursion
    
  3. Security
    - Users can only check their own admin status
    - Admin management must be done via SQL or server-side functions
    - This is actually MORE secure than allowing authenticated admins to add/remove admins
*/

-- Drop all policies
DROP POLICY IF EXISTS "Users can check their own admin status" ON admins;
DROP POLICY IF EXISTS "Admins can insert new admins" ON admins;
DROP POLICY IF EXISTS "Admins can delete admins" ON admins;

-- Only allow users to check their own admin status (no other operations via RLS)
CREATE POLICY "Users can check own admin status"
  ON admins
  FOR SELECT
  TO authenticated
  USING (id = auth.uid());
