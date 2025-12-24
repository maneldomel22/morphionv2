/*
  # Fix Stripe Customers Foreign Key

  1. Changes
    - Drop the existing foreign key from stripe_customers.user_id to auth.users
    - Add new foreign key from stripe_customers.user_id to profiles.id
    - Add index for better query performance
  
  2. Reasoning
    - Admin panel queries join stripe data with profiles table
    - Foreign key to auth.users causes issues with admin queries
    - By referencing profiles.id instead, we maintain data integrity while supporting admin functionality
  
  3. Notes
    - This is safe because profiles.id has same value as auth.users.id
    - ON DELETE CASCADE ensures cleanup when user is deleted
*/

-- Drop the old foreign key constraint that references auth.users
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_customers_user_id_fkey' 
    AND table_name = 'stripe_customers'
  ) THEN
    ALTER TABLE stripe_customers
      DROP CONSTRAINT stripe_customers_user_id_fkey;
  END IF;
END $$;

-- Add new foreign key constraint that references profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_customers_user_id_profiles_fkey' 
    AND table_name = 'stripe_customers'
  ) THEN
    ALTER TABLE stripe_customers
      ADD CONSTRAINT stripe_customers_user_id_profiles_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better join performance
CREATE INDEX IF NOT EXISTS idx_stripe_customers_user_id 
  ON stripe_customers(user_id) 
  WHERE deleted_at IS NULL;