/*
  # Create captions table

  1. New Tables
    - `captions`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `content` (text, the generated caption)
      - `tone` (text, the tone used)
      - `platform` (text, target platform)
      - `hashtags` (text array, generated hashtags)
      - `is_favorite` (boolean, default false)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `captions` table
    - Add policies for users to manage their own captions
*/

CREATE TABLE IF NOT EXISTS captions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  tone text NOT NULL DEFAULT 'casual',
  platform text NOT NULL DEFAULT 'instagram',
  hashtags text[] DEFAULT '{}',
  is_favorite boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE captions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own captions"
  ON captions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own captions"
  ON captions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own captions"
  ON captions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own captions"
  ON captions
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS captions_user_id_idx ON captions(user_id);
CREATE INDEX IF NOT EXISTS captions_created_at_idx ON captions(created_at DESC);
CREATE INDEX IF NOT EXISTS captions_is_favorite_idx ON captions(is_favorite);