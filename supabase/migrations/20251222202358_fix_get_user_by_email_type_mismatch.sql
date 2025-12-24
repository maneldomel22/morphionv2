/*
  # Fix get_user_by_email function type mismatch

  1. Changes
    - Drop and recreate `get_user_by_email` function with proper type casting
    - Cast the email field from character varying(255) to text explicitly
    - Maintains all security and functionality of the original function
  
  2. Security
    - Function remains SECURITY DEFINER to access auth schema
    - Only returns basic info (id, email) to prevent data leakage
    - Requires user to be authenticated
*/

-- Drop existing function
DROP FUNCTION IF EXISTS get_user_by_email(text);

-- Recreate function with proper type casting
CREATE OR REPLACE FUNCTION get_user_by_email(user_email text)
RETURNS TABLE (id uuid, email text) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email::text  -- Cast to text to match return type
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(TRIM(user_email))
  AND au.deleted_at IS NULL
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;