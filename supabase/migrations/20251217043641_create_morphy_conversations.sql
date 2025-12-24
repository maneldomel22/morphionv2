/*
  # Create Morphy Conversations Schema

  1. New Tables
    - `morphy_conversations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `openai_conversation_id` (text, stores OpenAI conversation ID)
      - `title` (text, conversation title)
      - `metadata` (jsonb, additional metadata)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
    
    - `morphy_messages`
      - `id` (uuid, primary key)
      - `conversation_id` (uuid, foreign key to morphy_conversations)
      - `openai_item_id` (text, stores OpenAI item ID)
      - `role` (text, user or assistant)
      - `content` (text, message content)
      - `suggestions` (jsonb, array of suggestions if assistant)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on both tables
    - Users can only access their own conversations and messages
    - Policies for select, insert, update, delete
*/

-- Create morphy_conversations table
CREATE TABLE IF NOT EXISTS morphy_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  openai_conversation_id text UNIQUE,
  title text NOT NULL,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create morphy_messages table
CREATE TABLE IF NOT EXISTS morphy_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES morphy_conversations(id) ON DELETE CASCADE NOT NULL,
  openai_item_id text,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  suggestions jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_morphy_conversations_user_id ON morphy_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_morphy_conversations_updated_at ON morphy_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_morphy_messages_conversation_id ON morphy_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_morphy_messages_created_at ON morphy_messages(created_at);

-- Enable RLS
ALTER TABLE morphy_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE morphy_messages ENABLE ROW LEVEL SECURITY;

-- Policies for morphy_conversations
CREATE POLICY "Users can view own conversations"
  ON morphy_conversations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
  ON morphy_conversations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
  ON morphy_conversations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
  ON morphy_conversations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policies for morphy_messages
CREATE POLICY "Users can view messages from own conversations"
  ON morphy_messages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM morphy_conversations
      WHERE morphy_conversations.id = morphy_messages.conversation_id
      AND morphy_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations"
  ON morphy_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM morphy_conversations
      WHERE morphy_conversations.id = morphy_messages.conversation_id
      AND morphy_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update messages in own conversations"
  ON morphy_messages FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM morphy_conversations
      WHERE morphy_conversations.id = morphy_messages.conversation_id
      AND morphy_conversations.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM morphy_conversations
      WHERE morphy_conversations.id = morphy_messages.conversation_id
      AND morphy_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete messages from own conversations"
  ON morphy_messages FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM morphy_conversations
      WHERE morphy_conversations.id = morphy_messages.conversation_id
      AND morphy_conversations.user_id = auth.uid()
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_morphy_conversation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE morphy_conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation's updated_at when a message is added
CREATE TRIGGER update_conversation_timestamp
  AFTER INSERT ON morphy_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_morphy_conversation_updated_at();