/*
  # Add Image Engine Tracking to Generated Images

  1. Changes
    - Add `image_model` column to track which engine was used
      - Values: 'nano_banana_pro', 'seedream_4_5'
    - Add `kie_model` column to store the full API model string
    - Add `generation_mode` column to track the generation type
      - Values: 'text-to-image', 'image-to-image'
    - Add `source_image_url` column for Seedream reference images

  2. Notes
    - Existing records default to 'nano_banana_pro'
    - All new columns are nullable for backward compatibility
    - Engine information helps with analytics and debugging
*/

-- Add image engine tracking columns
ALTER TABLE generated_images
ADD COLUMN IF NOT EXISTS image_model text,
ADD COLUMN IF NOT EXISTS kie_model text,
ADD COLUMN IF NOT EXISTS generation_mode text,
ADD COLUMN IF NOT EXISTS source_image_url text;

-- Set default values for existing records
UPDATE generated_images
SET
  image_model = 'nano_banana_pro',
  kie_model = 'nano-banana-pro',
  generation_mode = CASE
    WHEN prompt IS NOT NULL THEN 'text-to-image'
    ELSE 'text-to-image'
  END
WHERE image_model IS NULL;

-- Add check constraint for valid image models
ALTER TABLE generated_images
ADD CONSTRAINT valid_image_model
CHECK (image_model IN ('nano_banana_pro', 'seedream_4_5') OR image_model IS NULL);

-- Add check constraint for valid generation modes
ALTER TABLE generated_images
ADD CONSTRAINT valid_generation_mode
CHECK (generation_mode IN ('text-to-image', 'image-to-image') OR generation_mode IS NULL);

-- Create index for filtering by engine
CREATE INDEX IF NOT EXISTS idx_generated_images_image_model
ON generated_images(image_model);

-- Create index for filtering by generation mode
CREATE INDEX IF NOT EXISTS idx_generated_images_generation_mode
ON generated_images(generation_mode);
