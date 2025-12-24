/*
  # Create Storage Policies for wan-images Bucket

  1. Storage Policies
    - Allow authenticated users to upload to wan-images bucket
    - Allow public read access to wan-images bucket
    - Allow users to update their own files in wan-images bucket
    - Allow users to delete their own files in wan-images bucket

  2. Security
    - Uses Row Level Security on storage.objects table
    - Restricts uploads to authenticated users only
    - Allows public viewing of all images
    - Restricts updates/deletes to file owners only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to wan-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for wan-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in wan-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in wan-images" ON storage.objects;

-- Allow authenticated users to upload to wan-images
CREATE POLICY "Authenticated users can upload to wan-images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'wan-images');

-- Allow public read access for wan-images
CREATE POLICY "Public read access for wan-images"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'wan-images');

-- Allow users to update their own files in wan-images
CREATE POLICY "Users can update own files in wan-images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'wan-images' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'wan-images' AND auth.uid() = owner);

-- Allow users to delete their own files in wan-images
CREATE POLICY "Users can delete own files in wan-images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'wan-images' AND auth.uid() = owner);