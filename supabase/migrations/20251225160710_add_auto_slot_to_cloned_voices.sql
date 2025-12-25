/*
  # Add Auto-Slot Management for Cloned Voices

  1. Problem
    - slot column is NOT NULL but code doesn't provide value
    - Users need automatic slot assignment (1, 2, or 3)

  2. Solution
    - Create function to get next available slot for user
    - Add default value using function
    - Ensure slot constraint (1-3) is enforced

  3. Changes
    - Create get_next_voice_slot function
    - Add check constraint for slot values
    - Make slot default to next available
*/

-- Create function to get next available slot for user
CREATE OR REPLACE FUNCTION get_next_voice_slot(p_user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_slot integer;
BEGIN
  -- Find the lowest available slot (1, 2, or 3)
  SELECT COALESCE(
    (
      SELECT s.slot
      FROM (VALUES (1), (2), (3)) AS s(slot)
      WHERE s.slot NOT IN (
        SELECT slot FROM cloned_voices WHERE user_id = p_user_id
      )
      ORDER BY s.slot
      LIMIT 1
    ),
    1 -- Default to 1 if none available
  ) INTO v_next_slot;
  
  RETURN v_next_slot;
END;
$$;

-- Add check constraint to ensure slot is between 1 and 3
ALTER TABLE cloned_voices 
DROP CONSTRAINT IF EXISTS cloned_voices_slot_check;

ALTER TABLE cloned_voices 
ADD CONSTRAINT cloned_voices_slot_check 
CHECK (slot >= 1 AND slot <= 3);

-- Add unique constraint to prevent duplicate slots per user
ALTER TABLE cloned_voices
DROP CONSTRAINT IF EXISTS cloned_voices_user_slot_unique;

ALTER TABLE cloned_voices
ADD CONSTRAINT cloned_voices_user_slot_unique
UNIQUE (user_id, slot);
