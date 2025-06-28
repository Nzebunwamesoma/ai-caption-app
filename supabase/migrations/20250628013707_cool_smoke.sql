/*
  # Create API usage tracking table

  1. New Tables
    - `api_usage`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to profiles)
      - `requests_count` (integer, number of API requests)
      - `last_request_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `api_usage` table
    - Add policies for users to read their own usage data
*/

CREATE TABLE IF NOT EXISTS api_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  requests_count integer DEFAULT 0,
  last_request_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own API usage"
  ON api_usage
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own API usage"
  ON api_usage
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own API usage"
  ON api_usage
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create unique constraint to ensure one record per user
CREATE UNIQUE INDEX IF NOT EXISTS api_usage_user_id_unique ON api_usage(user_id);