/*
  # Add Foreign Keys to Stripe Tables
  
  1. Changes
    - Add foreign key constraint from stripe_customers.user_id to profiles.id
    - This enables proper relationships for joins in queries
  
  2. Security
    - Ensures data integrity between users and their Stripe customers
*/

-- Add foreign key constraint if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'stripe_customers_user_id_fkey' 
    AND table_name = 'stripe_customers'
  ) THEN
    ALTER TABLE stripe_customers
      ADD CONSTRAINT stripe_customers_user_id_fkey
      FOREIGN KEY (user_id)
      REFERENCES profiles(id)
      ON DELETE CASCADE;
  END IF;
END $$;
