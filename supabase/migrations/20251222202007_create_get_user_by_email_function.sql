/*
  # Create function to get user by email from auth.users

  1. New Functions
    - `get_user_by_email(email text)` - Returns user id and email from auth.users
      - Accessible to authenticated users
      - Searches case-insensitive
      - Returns null if not found
  
  2. Security
    - Function is marked as SECURITY DEFINER to access auth schema
    - Only returns basic info (id, email) to prevent data leakage
    - Requires user to be authenticated
*/

-- Create function to get user by email from auth.users
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
    au.email
  FROM auth.users au
  WHERE LOWER(au.email) = LOWER(TRIM(user_email))
  AND au.deleted_at IS NULL
  LIMIT 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_by_email(text) TO authenticated;
