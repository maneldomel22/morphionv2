/*
  # Update delete user sessions function to include refresh tokens

  1. Changes
    - Updates `delete_user_sessions()` function to also delete refresh tokens
    - This ensures that users are immediately logged out from all devices
    - Access tokens may remain valid until expiry, but users cannot refresh them

  2. How it works
    - Deletes all refresh tokens from auth.refresh_tokens
    - Deletes all sessions from auth.sessions
    - When the access token expires, user cannot get a new one and must login again
*/

-- Update function to delete all sessions AND refresh tokens for a specific user
CREATE OR REPLACE FUNCTION delete_user_sessions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all refresh tokens for the target user
  -- This is critical - without refresh tokens, users cannot renew their access tokens
  DELETE FROM auth.refresh_tokens
  WHERE user_id = target_user_id;

  -- Delete all sessions for the target user
  DELETE FROM auth.sessions
  WHERE user_id = target_user_id;
END;
$$;
