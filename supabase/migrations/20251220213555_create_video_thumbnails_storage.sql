/*
  # Create Video Thumbnails Storage Bucket and Policies

  1. Storage Bucket
    - Creates `video-thumbnails` bucket for storing video thumbnail images
    - Configured for public access to allow thumbnail display
    - Optimized for image storage with appropriate file size limits

  2. Storage Policies
    - Allow authenticated users to upload thumbnails
    - Allow public read access for all thumbnails
    - Allow users to update their own thumbnail files
    - Allow users to delete their own thumbnail files

  3. Security
    - Uses Row Level Security on storage.objects table
    - Restricts uploads to authenticated users only
    - Allows public viewing of all thumbnails for performance
    - Restricts updates/deletes to file owners only
*/

-- Create the video-thumbnails bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'video-thumbnails',
  'video-thumbnails',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to video-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for video-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in video-thumbnails" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in video-thumbnails" ON storage.objects;

-- Allow authenticated users to upload to video-thumbnails
CREATE POLICY "Authenticated users can upload to video-thumbnails"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'video-thumbnails');

-- Allow public read access for video-thumbnails
CREATE POLICY "Public read access for video-thumbnails"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'video-thumbnails');

-- Allow users to update their own files in video-thumbnails
CREATE POLICY "Users can update own files in video-thumbnails"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'video-thumbnails' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'video-thumbnails' AND auth.uid() = owner);

-- Allow users to delete their own files in video-thumbnails
CREATE POLICY "Users can delete own files in video-thumbnails"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'video-thumbnails' AND auth.uid() = owner);
