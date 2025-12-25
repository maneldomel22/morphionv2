/*
  # Allow public uploads to reference-images

  1. Purpose
    - Allow uploading BCT reference images
    - Temporary policy for initial setup

  2. Changes
    - Add policy for anon users to upload to bct/ folder
*/

DROP POLICY IF EXISTS "Anyone can upload to bct folder" ON storage.objects;
CREATE POLICY "Anyone can upload to bct folder"
  ON storage.objects
  FOR INSERT
  TO anon
  WITH CHECK (bucket_id = 'reference-images' AND (storage.foldername(name))[1] = 'bct');
