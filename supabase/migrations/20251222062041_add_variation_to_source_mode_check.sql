/*
  # Add 'variation' to source_mode check constraint

  1. Changes
    - Drop existing check constraint on videos.source_mode
    - Add new constraint including 'variation' as a valid value
  
  2. Valid source_mode values after migration
    - 'influencer' - Generated from influencer page
    - 'editor' - Created from scene editor
    - 'sora' - Manual Sora generation
    - 'autopilot' - Autopilot generation
    - 'manual' - Manual creation
    - 'variation' - Generated as variation of existing video
  
  3. Notes
    - Uses IF EXISTS to prevent errors if constraint doesn't exist
    - Existing data is not affected (only new inserts/updates)
*/

-- Drop existing constraint
ALTER TABLE videos 
DROP CONSTRAINT IF EXISTS videos_source_mode_check;

-- Add new constraint with 'variation' included
ALTER TABLE videos 
ADD CONSTRAINT videos_source_mode_check 
CHECK (source_mode = ANY (ARRAY[
  'influencer'::text, 
  'editor'::text, 
  'sora'::text, 
  'autopilot'::text, 
  'manual'::text,
  'variation'::text
]));
