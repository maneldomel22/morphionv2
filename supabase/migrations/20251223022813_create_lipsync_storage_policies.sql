/*
  # Create Storage Policies for LipSync Buckets

  1. Storage Policies for lipsync-videos
    - Allow authenticated users to upload to lipsync-videos bucket
    - Allow public read access to lipsync-videos bucket
    - Allow users to update their own files in lipsync-videos bucket
    - Allow users to delete their own files in lipsync-videos bucket

  2. Storage Policies for lipsync-audios
    - Allow authenticated users to upload to lipsync-audios bucket
    - Allow public read access to lipsync-audios bucket
    - Allow users to update their own files in lipsync-audios bucket
    - Allow users to delete their own files in lipsync-audios bucket

  3. Security
    - Uses Row Level Security on storage.objects table
    - Restricts uploads to authenticated users only
    - Allows public viewing of all files
    - Restricts updates/deletes to file owners only
*/

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload to lipsync-videos" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for lipsync-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in lipsync-videos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in lipsync-videos" ON storage.objects;

DROP POLICY IF EXISTS "Authenticated users can upload to lipsync-audios" ON storage.objects;
DROP POLICY IF EXISTS "Public read access for lipsync-audios" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in lipsync-audios" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in lipsync-audios" ON storage.objects;

-- Policies for lipsync-videos bucket
CREATE POLICY "Authenticated users can upload to lipsync-videos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lipsync-videos');

CREATE POLICY "Public read access for lipsync-videos"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'lipsync-videos');

CREATE POLICY "Users can update own files in lipsync-videos"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lipsync-videos' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'lipsync-videos' AND auth.uid() = owner);

CREATE POLICY "Users can delete own files in lipsync-videos"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'lipsync-videos' AND auth.uid() = owner);

-- Policies for lipsync-audios bucket
CREATE POLICY "Authenticated users can upload to lipsync-audios"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'lipsync-audios');

CREATE POLICY "Public read access for lipsync-audios"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'lipsync-audios');

CREATE POLICY "Users can update own files in lipsync-audios"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (bucket_id = 'lipsync-audios' AND auth.uid() = owner)
  WITH CHECK (bucket_id = 'lipsync-audios' AND auth.uid() = owner);

CREATE POLICY "Users can delete own files in lipsync-audios"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (bucket_id = 'lipsync-audios' AND auth.uid() = owner);
