/*
  # Create Admin Panel Infrastructure

  1. New Tables
    - `system_settings`
      - `key` (text, primary key) - configuration key
      - `value` (text) - configuration value
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
  
  2. New Functions
    - `add_user_credits(user_id, amount)` - adds credits to user account
    - `is_admin(user_id)` - checks if user is admin
  
  3. Security
    - Enable RLS on system_settings
    - Only admins can access system_settings
  
  4. Important Notes
    - System settings table for global configuration
    - Credit management function with proper history tracking
    - Admin verification function for use in policies
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS system_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on system_settings
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can access system_settings
CREATE POLICY "Only admins can view system_settings"
  ON system_settings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Only admins can insert system_settings"
  ON system_settings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Only admins can update system_settings"
  ON system_settings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

CREATE POLICY "Only admins can delete system_settings"
  ON system_settings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admins
      WHERE admins.id = auth.uid()
    )
  );

-- Insert default system settings
INSERT INTO system_settings (key, value) VALUES
  ('system_name', 'Morphion'),
  ('maintenance_mode', 'false'),
  ('maintenance_message', 'Sistema em manutenção. Voltaremos em breve!')
ON CONFLICT (key) DO NOTHING;

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins
    WHERE id = user_id
  );
$$;

-- Function to add credits to user account
CREATE OR REPLACE FUNCTION add_user_credits(
  target_user_id uuid,
  credit_amount integer,
  admin_note text DEFAULT 'Admin adjustment'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_credits integer;
  new_balance integer;
BEGIN
  -- Check if caller is admin
  IF NOT is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can add credits';
  END IF;

  -- Get current credits
  SELECT credits INTO current_credits
  FROM profiles
  WHERE id = target_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Calculate new balance
  new_balance := current_credits + credit_amount;

  -- Update user credits
  UPDATE profiles
  SET credits = new_balance
  WHERE id = target_user_id;

  -- Record in credits history
  INSERT INTO credits_history (
    user_id,
    amount,
    balance_after,
    type,
    description
  ) VALUES (
    target_user_id,
    credit_amount,
    new_balance,
    CASE 
      WHEN credit_amount > 0 THEN 'manual_add'
      ELSE 'manual_deduct'
    END,
    admin_note
  );
END;
$$;