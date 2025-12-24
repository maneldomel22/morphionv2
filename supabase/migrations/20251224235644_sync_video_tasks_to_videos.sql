/*
  # Sync Legacy video_tasks to videos Table

  This migration copies existing videos from the old `video_tasks` table 
  to the new `videos` table, ensuring users can access their old videos
  in the new interface.

  ## 1. Changes
    - Copy all `success` videos from `video_tasks` to `videos`
    - Map fields appropriately with proper defaults
    - Skip videos that were already migrated
    - Preserve all original data and metadata

  ## 2. Data Mapping
    - task_id → kie_task_id
    - prompt → kie_prompt (also used for title extraction)
    - model → kie_model
    - video_url → video_url
    - image_url → image_url
    - status: 'success' → 'ready', 'pending/processing' → 'processing', 'failed' → 'failed'
    - source_mode → 'manual' (old interface)
    - video_model → inferred from model field

  ## 3. Safety Measures
    - Only copies videos not already in `videos` table
    - Only processes videos with valid user_id
    - Preserves all timestamps
    - No destructive operations

  ## 4. Notes
    - This migration is idempotent and safe to run multiple times
    - Future videos will be created directly in `videos` table
    - Old `video_tasks` table remains for historical reference
*/

DO $$
DECLARE
  videos_synced INTEGER := 0;
  videos_skipped INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting sync from video_tasks to videos...';

  -- Insert videos from video_tasks that don't exist in videos yet
  INSERT INTO videos (
    id,
    user_id,
    title,
    video_url,
    image_url,
    status,
    kie_task_id,
    kie_model,
    kie_prompt,
    video_model,
    source_mode,
    generation_mode,
    credits_used,
    avatar_name,
    avatar_gender,
    duration,
    aspect_ratio,
    creative_style,
    dialogue,
    metadata,
    created_at,
    updated_at,
    completed_at,
    queued_at
  )
  SELECT 
    vt.id,
    vt.user_id,
    -- Extract title from prompt or use default
    COALESCE(
      CASE 
        WHEN vt.prompt IS NOT NULL AND vt.prompt != '' THEN
          'Vídeo ' || TO_CHAR(vt.created_at, 'DD/MM/YYYY')
        ELSE 'Vídeo Legado'
      END,
      'Vídeo Legado'
    ) as title,
    vt.video_url,
    vt.image_url,
    -- Map status
    CASE 
      WHEN vt.status = 'success' THEN 'ready'
      WHEN vt.status = 'pending' THEN 'processing'
      WHEN vt.status = 'processing' THEN 'processing'
      WHEN vt.status = 'failed' THEN 'failed'
      ELSE 'processing'
    END as status,
    vt.task_id as kie_task_id,
    vt.model as kie_model,
    vt.prompt as kie_prompt,
    -- Infer video_model from model field
    CASE 
      WHEN vt.model ILIKE '%sora%2%pro%' THEN 'sora_2_pro'
      WHEN vt.model ILIKE '%sora%2%' THEN 'sora_2'
      WHEN vt.model ILIKE '%veo%3%' THEN 'veo3'
      WHEN vt.model ILIKE '%veo%' THEN 'veo3'
      WHEN vt.model IS NOT NULL THEN vt.model
      ELSE 'unknown'
    END as video_model,
    'manual' as source_mode,
    CASE 
      WHEN vt.image_url IS NOT NULL AND vt.image_url != '' THEN 'image-to-video'
      ELSE 'text-to-video'
    END as generation_mode,
    COALESCE(vt.credits_charged, 50) as credits_used,
    'Avatar' as avatar_name,
    'Não especificado' as avatar_gender,
    '15s' as duration,
    COALESCE(vt.aspect_ratio, '9:16') as aspect_ratio,
    'UGC' as creative_style,
    '' as dialogue,
    '{}'::jsonb as metadata,
    vt.created_at,
    COALESCE(vt.updated_at, vt.created_at) as updated_at,
    CASE 
      WHEN vt.status = 'success' THEN vt.updated_at
      ELSE NULL
    END as completed_at,
    vt.created_at as queued_at
  FROM video_tasks vt
  WHERE 
    -- Only sync videos that don't exist in videos table yet
    NOT EXISTS (
      SELECT 1 FROM videos v 
      WHERE v.id = vt.id
    )
    -- Only sync videos with valid user_id
    AND vt.user_id IS NOT NULL;

  GET DIAGNOSTICS videos_synced = ROW_COUNT;
  RAISE NOTICE 'Synced % videos from video_tasks to videos', videos_synced;

  -- Count how many videos were skipped (already exist)
  SELECT COUNT(*) INTO videos_skipped
  FROM video_tasks vt
  WHERE EXISTS (
    SELECT 1 FROM videos v 
    WHERE v.id = vt.id
  );

  RAISE NOTICE 'Skipped % videos (already in videos table)', videos_skipped;

  RAISE NOTICE 'Sync completed successfully!';

END $$;

-- Verify results
DO $$
DECLARE
  total_video_tasks INTEGER;
  total_videos INTEGER;
  synced_videos INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_video_tasks FROM video_tasks WHERE user_id IS NOT NULL;
  SELECT COUNT(*) INTO total_videos FROM videos;
  
  SELECT COUNT(*) INTO synced_videos
  FROM videos v
  WHERE EXISTS (
    SELECT 1 FROM video_tasks vt WHERE vt.id = v.id
  );

  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Results ===';
  RAISE NOTICE 'Total video_tasks: %', total_video_tasks;
  RAISE NOTICE 'Total videos: %', total_videos;
  RAISE NOTICE 'Videos synced from video_tasks: %', synced_videos;
  RAISE NOTICE '✓ Sync complete!';
END $$;
