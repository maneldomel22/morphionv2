/*
  # Fix LipSync Tasks Default Values

  1. Changes
    - Update `video_enhance` default from 1 to 0 (no enhancement by default)
    - Update `fps` default from '25' to 'original' (keep original video fps)

  2. Rationale
    - According to Newport AI API documentation, it's recommended to use original video settings
    - This prevents unnecessary processing and maintains video quality
    - Users can still manually enable enhancement if needed
*/

-- Update video_enhance default to 0 (no enhancement by default)
ALTER TABLE lipsync_tasks 
  ALTER COLUMN video_enhance SET DEFAULT 0;

-- Update fps default to 'original' (keep original video fps)
ALTER TABLE lipsync_tasks 
  ALTER COLUMN fps SET DEFAULT 'original';
