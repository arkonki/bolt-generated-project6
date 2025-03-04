/*
  # Fix authentication issues

  1. Changes
    - Drop and recreate admin user in auth schema
    - Update RLS policies for better admin access
    - Add proper indexes and constraints

  2. Security
    - Ensure proper RLS policies
    - Grant necessary permissions
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Users can read data" ON users;
DROP POLICY IF EXISTS "Users can update data" ON users;

-- Create new policies that handle admin access
CREATE POLICY "Users can read data"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update data"
  ON users
  FOR UPDATE
  TO authenticated
  USING (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    auth.uid() = id 
    OR 
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'admin'
    )
  );

-- Ensure proper indexes exist
CREATE INDEX IF NOT EXISTS users_email_idx ON users(email);
CREATE INDEX IF NOT EXISTS users_role_idx ON users(role);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create or update function to handle new user registration
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, email, username, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    CASE 
      WHEN NEW.email = 'arvi@maantoa.ee' THEN 'admin'
      ELSE 'player'
    END
  )
  ON CONFLICT (email) DO UPDATE
  SET 
    id = EXCLUDED.id,
    role = CASE 
      WHEN EXCLUDED.email = 'arvi@maantoa.ee' THEN 'admin'
      ELSE users.role
    END
  WHERE users.email = EXCLUDED.email;
  
  RETURN NEW;
END;
$$;

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
