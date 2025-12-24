/*
  # Create Storage Buckets for LipSync

  1. Storage Buckets
    - `lipsync-videos` - For storing source videos for lip sync processing
      - Public access for viewing results
      - 50MB file size limit
      - Allowed types: video/mp4, video/quicktime, video/x-msvideo, video/webm
    
    - `lipsync-audios` - For storing audio files for lip sync processing
      - Public access for processing
      - 10MB file size limit
      - Allowed types: audio/mpeg, audio/wav, audio/mp3, audio/ogg

  2. Security
    - Buckets are public for read access
    - Upload restricted to authenticated users via RLS policies (already created in migration 20251223022813)
*/

-- Create lipsync-videos bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lipsync-videos',
  'lipsync-videos',
  true,
  52428800, -- 50MB
  ARRAY['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Create lipsync-audios bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'lipsync-audios',
  'lipsync-audios',
  true,
  10485760, -- 10MB
  ARRAY['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg']
)
ON CONFLICT (id) DO NOTHING;
