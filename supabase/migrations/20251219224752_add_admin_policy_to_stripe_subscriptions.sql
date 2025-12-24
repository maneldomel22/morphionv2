/*
  # Add Admin Policy to Stripe Subscriptions
  
  1. Changes
    - Add SELECT policy for admins to view all subscriptions
  
  2. Security
    - Only authenticated admins can view all subscriptions
    - Regular users can still only view their own subscriptions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'stripe_subscriptions' 
    AND policyname = 'Admins can view all subscriptions'
  ) THEN
    CREATE POLICY "Admins can view all subscriptions"
      ON stripe_subscriptions
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM admins
          WHERE admins.id = auth.uid()
        )
      );
  END IF;
END $$;
