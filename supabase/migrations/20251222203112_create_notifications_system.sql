/*
  # Create Notifications System

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users) - User who receives the notification
      - `type` (text) - Type of notification (e.g., 'folder_shared')
      - `title` (text) - Notification title
      - `message` (text) - Notification message
      - `data` (jsonb) - Additional data (folder_id, sharer_email, etc.)
      - `read` (boolean, default false) - Whether notification has been read
      - `created_at` (timestamptz)
  
  2. Functions
    - `create_folder_share_notification()` - Trigger function to create notification when folder is shared
  
  3. Security
    - Enable RLS on `notifications` table
    - Users can only read their own notifications
    - Users can update their own notifications (mark as read)
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, read);

-- Function to create notification when folder is shared
CREATE OR REPLACE FUNCTION create_folder_share_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  folder_name text;
  sharer_email text;
BEGIN
  -- Get folder name
  SELECT name INTO folder_name
  FROM video_folders
  WHERE id = NEW.folder_id;
  
  -- Get sharer email
  SELECT email INTO sharer_email
  FROM auth.users
  WHERE id = NEW.owner_id
  AND deleted_at IS NULL;
  
  -- Create notification
  INSERT INTO notifications (user_id, type, title, message, data)
  VALUES (
    NEW.shared_with,
    'folder_shared',
    'Nova pasta compartilhada',
    sharer_email || ' compartilhou a pasta "' || folder_name || '" com você',
    jsonb_build_object(
      'folder_id', NEW.folder_id,
      'folder_name', folder_name,
      'sharer_id', NEW.owner_id,
      'sharer_email', sharer_email,
      'share_id', NEW.id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on folder_shares
DROP TRIGGER IF EXISTS on_folder_share_created ON folder_shares;
CREATE TRIGGER on_folder_share_created
  AFTER INSERT ON folder_shares
  FOR EACH ROW
  EXECUTE FUNCTION create_folder_share_notification();