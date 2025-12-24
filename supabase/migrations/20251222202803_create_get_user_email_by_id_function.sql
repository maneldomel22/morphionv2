/*
  # Create function to get user email by ID from auth.users

  1. New Functions
    - `get_user_email_by_id(user_id uuid)` - Returns email from auth.users by user ID
      - Accessible to authenticated users
      - Returns null if not found
  
  2. Security
    - Function is marked as SECURITY DEFINER to access auth schema
    - Only returns email to prevent data leakage
    - Requires user to be authenticated
*/

-- Create function to get user email by ID from auth.users
CREATE OR REPLACE FUNCTION get_user_email_by_id(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email text;
BEGIN
  SELECT email::text INTO user_email
  FROM auth.users
  WHERE id = user_id
  AND deleted_at IS NULL;
  
  RETURN user_email;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_email_by_id(uuid) TO authenticated;