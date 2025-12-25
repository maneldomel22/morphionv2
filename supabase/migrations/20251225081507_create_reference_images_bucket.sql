/*
  # Create reference-images storage bucket

  1. Purpose
    - Store reference images for BCT influencer
    - Public access for image generation APIs
    - Used by image generation services

  2. Storage
    - Bucket: reference-images
    - Public access enabled
    - Max file size: 10MB
    - Allowed types: PNG, JPEG, WEBP

  3. Security
    - Public read access for all images
    - Authenticated users can upload
    - Service role can manage all files
*/

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'reference-images',
  'reference-images',
  true,
  10485760,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

DROP POLICY IF EXISTS "Public read access" ON storage.objects;
CREATE POLICY "Public read access"
  ON storage.objects
  FOR SELECT
  TO public
  USING (bucket_id = 'reference-images');

DROP POLICY IF EXISTS "Authenticated users can upload reference images" ON storage.objects;
CREATE POLICY "Authenticated users can upload reference images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'reference-images');

DROP POLICY IF EXISTS "Service role full access to reference images" ON storage.objects;
CREATE POLICY "Service role full access to reference images"
  ON storage.objects
  FOR ALL
  TO service_role
  USING (bucket_id = 'reference-images')
  WITH CHECK (bucket_id = 'reference-images');
