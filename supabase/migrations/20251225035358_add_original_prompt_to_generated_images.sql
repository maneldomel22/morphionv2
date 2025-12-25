/*
  # Add original_prompt to generated_images
  
  1. Changes
    - Add `original_prompt` column to store the user's original description before Morphy enhancement
    - The `prompt` column will continue to store the enhanced/improved prompt for API calls
    - The `original_prompt` will be displayed to users during generation
  
  2. Notes
    - Existing rows will have NULL original_prompt (legacy behavior)
    - New generations will populate both fields
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_images' AND column_name = 'original_prompt'
  ) THEN
    ALTER TABLE generated_images ADD COLUMN original_prompt text;
  END IF;
END $$;

COMMENT ON COLUMN generated_images.original_prompt IS 'User original prompt before Morphy enhancement';
COMMENT ON COLUMN generated_images.prompt IS 'Enhanced prompt sent to the API';
