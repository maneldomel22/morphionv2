/*
  # Create function to delete user sessions

  1. New Functions
    - `delete_user_sessions(target_user_id uuid)` - Deletes all active sessions for a user
      - This function can only be called by authenticated users
      - Deletes entries from auth.sessions table
      - Deletes entries from auth.refresh_tokens table
      - Forces user to re-authenticate on all devices

  2. Security
    - Function uses SECURITY DEFINER to access auth schema
    - Only accessible to authenticated users
    - Useful for admin forced logout functionality
*/

-- Create function to delete all sessions and refresh tokens for a specific user
CREATE OR REPLACE FUNCTION delete_user_sessions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all refresh tokens for the target user (this is the key!)
  DELETE FROM auth.refresh_tokens
  WHERE user_id = target_user_id;

  -- Delete all sessions for the target user
  DELETE FROM auth.sessions
  WHERE user_id = target_user_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION delete_user_sessions(uuid) TO authenticated;
