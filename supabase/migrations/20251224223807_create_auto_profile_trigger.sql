/*
  # Auto-create profiles for new users

  1. Purpose
    - Automatically create a profile entry when a new user signs up
    - Ensures every user has a corresponding profile record
    - Eliminates race conditions and manual profile creation errors

  2. Changes
    - Create trigger function to insert profile on new auth user
    - Extract first_name, last_name, and phone from user metadata
    - Set default credits to 0 for new users
    - Handle conflicts gracefully (ignore if profile already exists)

  3. Security
    - Function runs with security definer privileges
    - Only triggered by auth.users insertions
    - Protected against duplicate profile creation
*/

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, first_name, last_name, phone, credits)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'first_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'last_name', NULL),
    COALESCE(NEW.raw_user_meta_data->>'phone', NULL),
    0
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
