/*
  # Normalize Legacy Videos Data

  This migration ensures all videos from the old interface have proper values
  for newly added columns, enabling seamless compatibility between interfaces.

  ## 1. Changes
    - Set default `source_mode` = 'manual' for videos without it
    - Infer `video_model` from `kie_model` or `generation_mode` for legacy videos
    - Set `updated_at` = `created_at` for videos without updated_at
    - Ensure all videos have proper metadata structure

  ## 2. Data Mapping Strategy
    - Videos without source_mode → 'manual' (created via old interface)
    - Videos with kie_model 'Wan2.5' → video_model 'wan_2_5'
    - Videos with kie_model 'Sora2-pro' → video_model 'sora_2_pro'
    - Videos with kie_model 'Sora2' → video_model 'sora_2'
    - Videos with kie_model 'Veo3.1' → video_model 'veo_3_1'
    - Videos with generation_mode 'image-to-video' and no kie_model → 'wan_2_5'
    - Videos with generation_mode 'text-to-video' and no kie_model → 'veo3'

  ## 3. Safety Measures
    - Only updates NULL or empty values
    - Preserves all existing data
    - Uses WHERE clauses to target only legacy videos
    - No destructive operations (DROP, DELETE)

  ## 4. Notes
    - This migration is idempotent and safe to run multiple times
    - Existing videos with proper values are not touched
    - All changes maintain referential integrity
*/

DO $$
DECLARE
  videos_updated INTEGER := 0;
  source_mode_fixed INTEGER := 0;
  video_model_fixed INTEGER := 0;
  updated_at_fixed INTEGER := 0;
BEGIN
  RAISE NOTICE 'Starting legacy videos normalization...';

  -- 1. Fix source_mode for legacy videos
  -- Videos without source_mode get 'manual' (created via old interface)
  UPDATE videos
  SET source_mode = 'manual'
  WHERE source_mode IS NULL;

  GET DIAGNOSTICS source_mode_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed source_mode for % videos', source_mode_fixed;

  -- 2. Fix video_model based on kie_model
  -- Map kie_model values to standardized video_model values
  UPDATE videos
  SET video_model = CASE
    WHEN kie_model ILIKE '%wan%2.5%' OR kie_model ILIKE '%wan2.5%' THEN 'wan_2_5'
    WHEN kie_model ILIKE '%sora%2%pro%' OR kie_model ILIKE '%sora2-pro%' THEN 'sora_2_pro'
    WHEN kie_model ILIKE '%sora%2%' OR kie_model ILIKE '%sora2%' THEN 'sora_2'
    WHEN kie_model ILIKE '%veo%3.1%' OR kie_model ILIKE '%veo3.1%' THEN 'veo_3_1'
    WHEN kie_model ILIKE '%veo%3%' OR kie_model ILIKE '%veo3%' THEN 'veo3'
    ELSE kie_model
  END
  WHERE video_model IS NULL AND kie_model IS NOT NULL;

  GET DIAGNOSTICS video_model_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed video_model from kie_model for % videos', video_model_fixed;

  -- 3. Fix video_model based on generation_mode (fallback)
  -- For videos without kie_model, infer from generation_mode
  UPDATE videos
  SET video_model = CASE
    WHEN generation_mode = 'image-to-video' THEN 'wan_2_5'
    WHEN generation_mode = 'text-to-video' THEN 'veo3'
    ELSE 'unknown'
  END
  WHERE video_model IS NULL AND generation_mode IS NOT NULL;

  GET DIAGNOSTICS videos_updated = ROW_COUNT;
  RAISE NOTICE 'Fixed video_model from generation_mode for % videos', videos_updated;

  -- 4. Fix updated_at for legacy videos
  -- Set updated_at = created_at for videos without updated_at
  UPDATE videos
  SET updated_at = created_at
  WHERE updated_at IS NULL AND created_at IS NOT NULL;

  GET DIAGNOSTICS updated_at_fixed = ROW_COUNT;
  RAISE NOTICE 'Fixed updated_at for % videos', updated_at_fixed;

  -- 5. Ensure metadata is valid JSONB
  -- Convert NULL metadata to empty object
  UPDATE videos
  SET metadata = '{}'::jsonb
  WHERE metadata IS NULL;

  GET DIAGNOSTICS videos_updated = ROW_COUNT;
  RAISE NOTICE 'Fixed metadata for % videos', videos_updated;

  RAISE NOTICE 'Legacy videos normalization completed successfully!';
  RAISE NOTICE 'Summary: source_mode=%, video_model=%, updated_at=%',
    source_mode_fixed, video_model_fixed, updated_at_fixed;

END $$;

-- Verify results
DO $$
DECLARE
  total_videos INTEGER;
  videos_without_source_mode INTEGER;
  videos_without_video_model INTEGER;
  videos_without_updated_at INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_videos FROM videos;
  SELECT COUNT(*) INTO videos_without_source_mode FROM videos WHERE source_mode IS NULL;
  SELECT COUNT(*) INTO videos_without_video_model FROM videos WHERE video_model IS NULL;
  SELECT COUNT(*) INTO videos_without_updated_at FROM videos WHERE updated_at IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '=== Verification Results ===';
  RAISE NOTICE 'Total videos: %', total_videos;
  RAISE NOTICE 'Videos without source_mode: %', videos_without_source_mode;
  RAISE NOTICE 'Videos without video_model: %', videos_without_video_model;
  RAISE NOTICE 'Videos without updated_at: %', videos_without_updated_at;

  IF videos_without_source_mode = 0 AND videos_without_video_model = 0 THEN
    RAISE NOTICE '✓ All videos are normalized!';
  ELSE
    RAISE WARNING '⚠ Some videos still need attention';
  END IF;
END $$;
