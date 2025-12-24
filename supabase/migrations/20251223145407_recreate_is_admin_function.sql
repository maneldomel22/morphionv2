/*
  # Recreate is_admin Function
  
  1. Changes
    - Drop and recreate the is_admin function to ensure it works correctly with the admins table
  
  2. Security
    - Function uses SECURITY DEFINER to check admin status
*/

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS is_admin(uuid);

-- Recreate the function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE id = user_id
  );
$$;
