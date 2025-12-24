/*
  # Create Generated Images Table

  1. New Tables
    - `generated_images`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `image_url` (text) - URL of the generated image
      - `prompt` (text) - Description used to generate the image
      - `aspect_ratio` (text) - Aspect ratio used (1:1, 4:5, 16:9)
      - `product_image_url` (text, nullable) - URL of product image used
      - `character_image_url` (text, nullable) - URL of character image used
      - `task_id` (text, nullable) - KIE API task ID
      - `visual_prompt` (jsonb, nullable) - Full visual prompt JSON
      - `created_at` (timestamptz) - Creation timestamp

  2. Security
    - Enable RLS on `generated_images` table
    - Add policy for users to read their own images
    - Add policy for users to insert their own images
    - Add policy for users to delete their own images
*/

CREATE TABLE IF NOT EXISTS generated_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  image_url text NOT NULL,
  prompt text NOT NULL,
  aspect_ratio text DEFAULT '4:5',
  product_image_url text,
  character_image_url text,
  task_id text,
  visual_prompt jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE generated_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own images"
  ON generated_images
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own images"
  ON generated_images
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own images"
  ON generated_images
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS generated_images_user_id_idx ON generated_images(user_id);
CREATE INDEX IF NOT EXISTS generated_images_created_at_idx ON generated_images(created_at DESC);