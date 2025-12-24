/*
  # Add base_prompt field to videos table

  1. Changes
    - Add `base_prompt` column to store the complete, immutable prompt used to generate the video
    - Add `base_dialogue` column to store the dialogue extracted from the prompt for easy reference
    - These fields enable the variation system to apply patches instead of rebuilding prompts
  
  2. Why This Matters
    - The base_prompt is the SOURCE OF TRUTH for all variations
    - It contains all technical headers, environment rules, timing constraints, and cinematography rules
    - Variations will NEVER rebuild this prompt - they only patch specific blocks
    - This ensures consistency across all video variations
  
  3. Notes
    - base_prompt should be saved when a video is first generated
    - base_dialogue is extracted from the DIALOGUE block of the prompt
    - Existing videos will have NULL values (they can't generate proper variations until regenerated)
*/

-- Add base_prompt and base_dialogue columns
ALTER TABLE videos 
ADD COLUMN IF NOT EXISTS base_prompt text,
ADD COLUMN IF NOT EXISTS base_dialogue text;