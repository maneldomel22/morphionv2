/*
  # Add age and style fields to influencers table
  
  Adds fields for better influencer profiling:
  
  1. Changes to influencers table
    - Add `age` (integer, nullable) - Influencer's age
    - Add `style` (text, nullable) - Influencer style (lifestyle, fitness, hot, luxury, casual, gamer, etc.)
  
  2. No breaking changes
    - All fields are nullable for backward compatibility
*/

-- Add age and style to influencers
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'age'
  ) THEN
    ALTER TABLE influencers ADD COLUMN age integer;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'style'
  ) THEN
    ALTER TABLE influencers ADD COLUMN style text;
  END IF;
END $$;