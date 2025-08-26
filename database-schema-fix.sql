-- Database Schema Fix for WingMan AI
-- Run this to check and fix any UUID/TEXT mismatches

-- ============================================================================
-- STEP 1: CHECK CURRENT SCHEMA
-- ============================================================================

-- Check the actual data types in your database
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'conversations', 'scenarios', 'personas')
  AND column_name IN ('id', 'user_id', 'scenario_id', 'persona_id')
ORDER BY table_name, column_name;

-- ============================================================================
-- STEP 2: FIX SCHEMA IF NEEDED
-- ============================================================================

-- If your users table has UUID instead of TEXT, run this section:
/*
-- WARNING: This will drop existing data! Backup first if needed.

-- Drop all dependent tables first
DROP TABLE IF EXISTS conversations CASCADE;

-- Recreate users table with TEXT id (for Clerk compatibility)
DROP TABLE IF EXISTS users CASCADE;
CREATE TABLE users (
  id TEXT PRIMARY KEY,
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

-- Recreate conversations table with TEXT foreign keys
CREATE TABLE conversations (
  id TEXT PRIMARY KEY DEFAULT ('conv_' || extract(epoch from now()) || '_' || floor(random() * 1000)::text),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  scenario_id TEXT NOT NULL REFERENCES scenarios(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  messages JSONB[],
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  feedback JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_users_is_premium ON users(is_premium);
CREATE INDEX idx_users_created_at ON users(created_at);
CREATE INDEX idx_users_last_login ON users(last_login);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_scenario_id ON conversations(scenario_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

*/

-- ============================================================================
-- STEP 3: ALTERNATIVE - WORK WITH EXISTING UUID SCHEMA
-- ============================================================================

-- If you want to keep UUID schema, here's a test that works with UUIDs:

DO $$
DECLARE
  users_id_type TEXT;
  test_user_id TEXT;
  test_conversation_id TEXT;
BEGIN
  -- Check if users.id is UUID or TEXT
  SELECT data_type INTO users_id_type
  FROM information_schema.columns 
  WHERE table_name = 'users' AND column_name = 'id';
  
  RAISE NOTICE 'Users ID type: %', users_id_type;
  
  IF users_id_type = 'uuid' THEN
    -- Work with UUID schema
    RAISE NOTICE '✅ Working with UUID schema';
    
    -- Insert test persona
    INSERT INTO personas (id, name, age, occupation, communication_style, background)
    VALUES ('test-persona-uuid', 'Test Persona UUID', 25, 'Test Occupation', 'friendly', 'Test background');
    
    -- Insert test scenario
    INSERT INTO scenarios (id, title, description, setting, category, difficulty, is_premium, persona_id, image, context)
    VALUES ('test-scenario-uuid', 'Test Scenario UUID', 'Test Description', 'Test Setting', 'test', 'beginner', false, 'test-persona-uuid', '/test.jpg', 'Test context');
    
    -- Insert test user with UUID
    test_user_id := gen_random_uuid()::text;
    INSERT INTO users (id, email, name)
    VALUES (test_user_id::uuid, 'uuid-test@example.com', 'UUID Test User');
    
    -- Insert test conversation
    INSERT INTO conversations (user_id, scenario_id)
    VALUES (test_user_id::uuid, 'test-scenario-uuid');
    
    -- Verify
    PERFORM * FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.email = 'uuid-test@example.com';
    
    RAISE NOTICE '✅ UUID foreign key test passed';
    
    -- Clean up
    DELETE FROM conversations WHERE user_id = test_user_id::uuid;
    DELETE FROM users WHERE id = test_user_id::uuid;
    DELETE FROM scenarios WHERE id = 'test-scenario-uuid';
    DELETE FROM personas WHERE id = 'test-persona-uuid';
    
  ELSE
    -- Work with TEXT schema
    RAISE NOTICE '✅ Working with TEXT schema';
    
    -- Standard TEXT-based test
    INSERT INTO personas (id, name, age, occupation, communication_style, background)
    VALUES ('test-persona-text', 'Test Persona TEXT', 25, 'Test Occupation', 'friendly', 'Test background');
    
    INSERT INTO scenarios (id, title, description, setting, category, difficulty, is_premium, persona_id, image, context)
    VALUES ('test-scenario-text', 'Test Scenario TEXT', 'Test Description', 'Test Setting', 'test', 'beginner', false, 'test-persona-text', '/test.jpg', 'Test context');
    
    INSERT INTO users (id, email, name)
    VALUES ('test-user-text', 'text-test@example.com', 'TEXT Test User');
    
    INSERT INTO conversations (user_id, scenario_id)
    VALUES ('test-user-text', 'test-scenario-text');
    
    RAISE NOTICE '✅ TEXT foreign key test passed';
    
    -- Clean up
    DELETE FROM conversations WHERE user_id = 'test-user-text';
    DELETE FROM users WHERE id = 'test-user-text';
    DELETE FROM scenarios WHERE id = 'test-scenario-text';
    DELETE FROM personas WHERE id = 'test-persona-text';
    
  END IF;
END $$;

-- ============================================================================
-- STEP 4: VERIFY FINAL SCHEMA
-- ============================================================================

-- Show final schema summary
SELECT 
  'Schema Summary' as info,
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') as users_id_type,
  (SELECT data_type FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'user_id') as conversations_user_id_type,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM conversations) as total_conversations;
