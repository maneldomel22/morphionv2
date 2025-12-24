/*
  # Fix delete user sessions UUID type casting

  1. Changes
    - Updates `delete_user_sessions()` to properly cast UUID parameters
    - Handles type mismatch between function parameter and table columns
    - Uses explicit casting to ensure compatibility

  2. Technical Details
    - Some auth tables may store user_id as text/varchar
    - Function explicitly casts UUID to text for comparison
    - Ensures compatibility across different Supabase versions
*/

-- Update function with proper UUID casting
CREATE OR REPLACE FUNCTION delete_user_sessions(target_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Delete all refresh tokens for the target user
  -- Cast UUID to text to match column type if needed
  DELETE FROM auth.refresh_tokens
  WHERE user_id::uuid = target_user_id;

  -- Delete all sessions for the target user
  DELETE FROM auth.sessions
  WHERE user_id::uuid = target_user_id;
END;
$$;
