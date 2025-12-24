/*
  # Make thumbnail_url nullable
  
  1. Changes
    - Alter `thumbnail_url` column in `videos` table to allow NULL values
    - Update existing videos with Pexels placeholder to NULL
  
  2. Reasoning
    - Videos in queue/processing don't have thumbnails yet
    - Thumbnails should only be set when video is successfully generated
    - Frontend now conditionally renders based on video status
*/

-- Make thumbnail_url nullable
ALTER TABLE videos 
ALTER COLUMN thumbnail_url DROP NOT NULL;

-- Update existing videos with placeholder thumbnails to NULL
UPDATE videos 
SET thumbnail_url = NULL 
WHERE thumbnail_url LIKE '%pexels%';