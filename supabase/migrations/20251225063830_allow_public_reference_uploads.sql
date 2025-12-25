/*
  # Allow Public Uploads to Reference Folder
  
  1. Changes
    - Add policy to allow anyone to upload to wan-images/reference/ folder
    - This is needed for storing reference images that are used in prompts
  
  2. Security
    - Only allows uploads to reference/ prefix
    - Public read access already exists
    - Reference images are used as input for AI models
*/

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public can upload to reference folder" ON storage.objects;

-- Allow public uploads to reference folder in wan-images bucket
CREATE POLICY "Public can upload to reference folder"
  ON storage.objects
  FOR INSERT
  TO public
  WITH CHECK (
    bucket_id = 'wan-images' 
    AND (storage.foldername(name))[1] = 'reference'
  );