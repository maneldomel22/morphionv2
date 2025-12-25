/*
  # Add Status Tracking to Generated Images

  This migration enables background image generation by adding status tracking fields.

  ## Changes to generated_images table
    - Add `status` column with values: 'generating', 'completed', 'failed'
    - Add `error_message` text column for failure tracking
    - Add index on status column for efficient queries
    - Make image_url nullable to support placeholder state
    - Set default status to 'completed' for existing records

  ## Notes
    - All existing records default to 'completed' status (assumed done)
    - New records can start with 'generating' status
    - Error messages help with debugging failed generations
    - Nullable image_url allows saving record before image is ready
*/

-- Add status column to generated_images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_images' AND column_name = 'status'
  ) THEN
    ALTER TABLE generated_images
    ADD COLUMN status text NOT NULL DEFAULT 'completed'
    CHECK (status IN ('generating', 'completed', 'failed'));
  END IF;
END $$;

-- Add error_message column to generated_images table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'generated_images' AND column_name = 'error_message'
  ) THEN
    ALTER TABLE generated_images ADD COLUMN error_message text;
  END IF;
END $$;

-- Make image_url nullable to support generating state
DO $$
BEGIN
  ALTER TABLE generated_images ALTER COLUMN image_url DROP NOT NULL;
END $$;

-- Create index for better query performance on status
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);

-- Create index for filtering generating images by user
CREATE INDEX IF NOT EXISTS idx_generated_images_user_status
ON generated_images(user_id, status)
WHERE status = 'generating';
