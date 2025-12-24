/*
  # Fix influencer age field type
  
  Changes age field from integer to text to support age ranges like "18-25", "26-35", etc.
  
  1. Changes
    - Alter `age` column type from integer to text
    - Preserves existing data by converting numbers to text
    - Allows age ranges (e.g., "18-25", "20s", "30s")
  
  2. No breaking changes
    - Existing numeric ages are converted to text
    - NULL values remain NULL
*/

-- Change age column type from integer to text
ALTER TABLE influencers 
ALTER COLUMN age TYPE text 
USING CASE 
  WHEN age IS NULL THEN NULL
  ELSE age::text
END;

-- Add comment explaining the field
COMMENT ON COLUMN influencers.age IS 'Age range of influencer (e.g., "18-25", "26-35", "20s", "30s")';