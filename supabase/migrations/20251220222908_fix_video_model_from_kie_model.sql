/*
  # Fix video_model for old videos using kie_model as source of truth

  1. Diagnosis
    - First run SELECT queries to understand current state
    - Show how many videos need correction
    - Show examples of kie_model values

  2. Correction Strategy
    - Use kie_model as the ONLY source of truth
    - Map kie_model to standardized video_model values
    - DO NOT infer from generation_mode
    - DO NOT guess or assume

  3. Standardized Models
    - wan_2_5
    - veo_3_1
    - sora_2
    - sora_2_pro

  4. Safety
    - Only update WHERE video_model IS NULL
    - Only update WHERE kie_model IS NOT NULL
    - Run diagnostic SELECTs before UPDATE
*/

-- DIAGNOSTIC: Show videos without video_model
DO $$
DECLARE
  null_count int;
  wan_count int;
  sora_count int;
  veo_count int;
BEGIN
  -- Count videos with null video_model
  SELECT COUNT(*) INTO null_count
  FROM videos
  WHERE video_model IS NULL;
  
  RAISE NOTICE 'Total videos with NULL video_model: %', null_count;

  -- Count by kie_model pattern
  SELECT COUNT(*) INTO wan_count
  FROM videos
  WHERE video_model IS NULL
    AND kie_model LIKE '%wan%';
  
  RAISE NOTICE 'Videos with kie_model containing "wan": %', wan_count;

  SELECT COUNT(*) INTO sora_count
  FROM videos
  WHERE video_model IS NULL
    AND kie_model LIKE '%sora%';
  
  RAISE NOTICE 'Videos with kie_model containing "sora": %', sora_count;

  SELECT COUNT(*) INTO veo_count
  FROM videos
  WHERE video_model IS NULL
    AND kie_model LIKE '%veo%';
  
  RAISE NOTICE 'Videos with kie_model containing "veo": %', veo_count;
END $$;

-- CORRECTION: Map kie_model to video_model
-- Only update where video_model is NULL and kie_model exists

-- Update WAN videos
UPDATE videos
SET video_model = 'wan_2_5'
WHERE video_model IS NULL
  AND kie_model IS NOT NULL
  AND kie_model LIKE '%wan%';

-- Update Sora 2 Pro videos
UPDATE videos
SET video_model = 'sora_2_pro'
WHERE video_model IS NULL
  AND kie_model IS NOT NULL
  AND kie_model LIKE '%sora-2-pro%';

-- Update Sora 2 videos (must come after sora-2-pro check)
UPDATE videos
SET video_model = 'sora_2'
WHERE video_model IS NULL
  AND kie_model IS NOT NULL
  AND kie_model LIKE '%sora-2%'
  AND kie_model NOT LIKE '%sora-2-pro%';

-- Update Veo videos
UPDATE videos
SET video_model = 'veo_3_1'
WHERE video_model IS NULL
  AND kie_model IS NOT NULL
  AND kie_model LIKE '%veo%';

-- VERIFICATION: Show remaining null video_model count
DO $$
DECLARE
  remaining_count int;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM videos
  WHERE video_model IS NULL;
  
  RAISE NOTICE 'Remaining videos with NULL video_model after correction: %', remaining_count;
END $$;
