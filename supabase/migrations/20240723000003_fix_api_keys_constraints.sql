-- Fix constraints on api_keys table

-- First, drop the existing foreign key constraint if it exists
ALTER TABLE IF EXISTS api_keys DROP CONSTRAINT IF EXISTS api_keys_user_id_fkey;

-- Add the foreign key constraint back with proper settings
ALTER TABLE IF EXISTS api_keys
  ADD CONSTRAINT api_keys_user_id_fkey
  FOREIGN KEY (user_id)
  REFERENCES auth.users(id)
  ON DELETE CASCADE;

-- Add a unique constraint to prevent duplicate entries
ALTER TABLE IF EXISTS api_keys
  DROP CONSTRAINT IF EXISTS api_keys_user_agent_unique;

ALTER TABLE IF EXISTS api_keys
  ADD CONSTRAINT api_keys_user_agent_unique
  UNIQUE (user_id, agent_id);

-- Make sure the table is in the realtime publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR ALL TABLES;
