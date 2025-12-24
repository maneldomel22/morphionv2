/*
  # Add Identity Profile to Influencers

  Adds comprehensive identity tracking for consistent influencer generation across all content types.

  1. Changes to influencers table
    - Add `identity_profile` (jsonb) - Complete physical identity data including face, hair, body, and body marks
    - Add index on identity_profile for efficient JSON queries

  2. Structure of identity_profile JSONB
    {
      "face": {
        "ethnicity": string,
        "skin_tone": string,
        "skin_tone_detail": string (optional),
        "eyes": {
          "color": string,
          "shape": string
        },
        "face_shape": string,
        "nose": string,
        "lips": string,
        "base_expression": string
      },
      "hair": {
        "color": string,
        "style": string,
        "length": string,
        "texture": string
      },
      "body": {
        "type": string,
        "height": string,
        "proportions": string,
        "shoulders": string,
        "waist": string,
        "hips": string,
        "legs": string,
        "posture": string
      },
      "body_marks": {
        "tattoos": [{ "location": string, "size": string, "style": string }],
        "moles": [{ "location": string }],
        "scars": [{ "location": string, "visibility": string }]
      }
    }

  3. Purpose
    - Ensures visual consistency across all generated content
    - Preserves influencer identity across images and videos
    - Enables detailed physical descriptions in AI prompts
    - Supports both SAFE and HOT content generation modes
*/

-- Add identity_profile column to influencers table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'influencers' AND column_name = 'identity_profile'
  ) THEN
    ALTER TABLE influencers ADD COLUMN identity_profile jsonb;
  END IF;
END $$;

-- Create GIN index for efficient JSON queries on identity_profile
CREATE INDEX IF NOT EXISTS idx_influencers_identity_profile ON influencers USING GIN (identity_profile);

-- Add comment explaining the column
COMMENT ON COLUMN influencers.identity_profile IS 'Complete physical identity data (face, hair, body, marks) for consistent AI generation';
