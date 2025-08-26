-- Supabase migration for WingMan AI user profiles (FIXED VERSION)
-- Run this SQL in your Supabase SQL editor to create the updated tables

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- First, backup existing data if you have any
-- CREATE TABLE users_backup AS SELECT * FROM users;

-- Drop existing users table and recreate with new schema
DROP TABLE IF EXISTS users CASCADE;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  date_of_birth DATE,
  professional_status TEXT CHECK (professional_status IN ('student', 'employed', 'self-employed', 'unemployed', 'retired', 'freelancer', 'entrepreneur', 'prefer-not-to-say')),
  gender TEXT CHECK (gender IN ('man', 'woman', 'non-binary', 'genderfluid', 'agender', 'prefer-not-to-say', 'other')),
  relationship_status TEXT CHECK (relationship_status IN ('single', 'dating', 'in-a-relationship', 'engaged', 'married', 'its-complicated', 'prefer-not-to-say')),
  subscription_tier TEXT NOT NULL DEFAULT 'free' CHECK (subscription_tier IN ('trial', 'weekly', 'monthly', 'free')),
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_login TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  streak INTEGER NOT NULL DEFAULT 0,
  badges TEXT[] DEFAULT '{}',
  practice_stats JSONB DEFAULT '{
    "totalConversations": 0,
    "completedScenarios": [],
    "voiceMinutes": 0,
    "averageScore": 0,
    "improvementRate": 0,
    "favoriteScenarios": [],
    "weakAreas": [],
    "strongAreas": []
  }',
  login_history JSONB[] DEFAULT '{}',
  usage_metrics JSONB DEFAULT '{
    "daily_usage": {},
    "weekly_usage": {},
    "monthly_usage": {},
    "feature_usage": {
      "text_chat": 0,
      "voice_practice": 0,
      "feedback_views": 0,
      "scenario_completions": 0
    },
    "engagement_score": 0,
    "last_activity": ""
  }'
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_is_premium ON users(is_premium);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read and update their own data
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Update existing tables if they exist (optional, for existing scenarios/personas/conversations)
-- Ensure scenarios table exists
CREATE TABLE IF NOT EXISTS scenarios (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  setting TEXT NOT NULL,
  category TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  persona_id TEXT NOT NULL,
  image TEXT NOT NULL,
  context TEXT NOT NULL,
  objectives TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure personas table exists
CREATE TABLE IF NOT EXISTS personas (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  age INTEGER NOT NULL,
  occupation TEXT NOT NULL,
  personality_traits TEXT[],
  interests TEXT[],
  communication_style TEXT NOT NULL,
  background TEXT NOT NULL,
  opening_lines TEXT[],
  response_patterns JSONB,
  voice_characteristics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure conversations table exists
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  messages JSONB[],
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_scenario_id ON conversations(scenario_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Enable RLS for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations" ON conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations" ON conversations
  FOR UPDATE USING (auth.uid() = user_id);

-- Create a function to update the last_login timestamp
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_login = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update last_login on any update
CREATE TRIGGER trigger_update_last_login
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_last_login();

-- Insert sample data (optional)
-- You can add sample scenarios and personas here

COMMENT ON TABLE users IS 'Enhanced user profiles with comprehensive tracking';
COMMENT ON COLUMN users.practice_stats IS 'JSON object containing practice statistics and progress data';
COMMENT ON COLUMN users.usage_metrics IS 'JSON object containing usage analytics and engagement metrics';
COMMENT ON COLUMN users.login_history IS 'Array of login session objects with timestamps and metadata';
