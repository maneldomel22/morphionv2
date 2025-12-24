/*
  # Add folder_id column to videos table
  
  1. Changes
    - Add `folder_id` column to `videos` table with foreign key to `video_folders`
    - This allows videos to be organized in folders just like video_tasks
    
  2. Notes
    - Column is nullable to allow videos without folders
    - Uses ON DELETE SET NULL to prevent orphaned videos when a folder is deleted
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'videos' AND column_name = 'folder_id'
  ) THEN
    ALTER TABLE videos ADD COLUMN folder_id uuid REFERENCES video_folders(id) ON DELETE SET NULL;
  END IF;
END $$;