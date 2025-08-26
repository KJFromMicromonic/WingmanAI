-- SQL Validation Tests for WingMan AI Database
-- Run these queries in your Supabase SQL Editor to test constraints and data integrity

-- ============================================================================
-- PHASE 1: SCHEMA VALIDATION
-- ============================================================================

-- Test 1: Verify all required tables exist
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
    THEN '✅ users table exists'
    ELSE '❌ users table missing'
  END as users_table_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'scenarios') 
    THEN '✅ scenarios table exists'
    ELSE '❌ scenarios table missing'
  END as scenarios_table_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'personas') 
    THEN '✅ personas table exists'
    ELSE '❌ personas table missing'
  END as personas_table_check,
  
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conversations') 
    THEN '✅ conversations table exists'
    ELSE '❌ conversations table missing'
  END as conversations_table_check;

-- Test 2: Verify users table has all required columns
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- ============================================================================
-- PHASE 2: CONSTRAINT VALIDATION TESTS
-- ============================================================================

-- Test 3: Gender constraint validation
BEGIN;
  -- This should FAIL (invalid gender)
  INSERT INTO users (id, email, name, gender) 
  VALUES ('test-invalid-gender', 'test1@example.com', 'Test User', 'invalid-gender');
ROLLBACK;
-- Expected: ERROR - check constraint violation

-- Test 4: Subscription tier constraint validation  
BEGIN;
  -- This should FAIL (invalid subscription tier)
  INSERT INTO users (id, email, name, subscription_tier) 
  VALUES ('test-invalid-tier', 'test2@example.com', 'Test User', 'invalid-tier');
ROLLBACK;
-- Expected: ERROR - check constraint violation

-- Test 5: Professional status constraint validation
BEGIN;
  -- This should FAIL (invalid professional status)
  INSERT INTO users (id, email, name, professional_status) 
  VALUES ('test-invalid-profession', 'test3@example.com', 'Test User', 'invalid-profession');
ROLLBACK;
-- Expected: ERROR - check constraint violation

-- Test 6: Relationship status constraint validation
BEGIN;
  -- This should FAIL (invalid relationship status)
  INSERT INTO users (id, email, name, relationship_status) 
  VALUES ('test-invalid-relationship', 'test4@example.com', 'Test User', 'invalid-relationship');
ROLLBACK;
-- Expected: ERROR - check constraint violation

-- ============================================================================
-- PHASE 3: VALID DATA INSERTION TESTS
-- ============================================================================

-- Test 7: Valid user insertion with all inclusive options
BEGIN;
  -- Test all valid gender options
  INSERT INTO users (id, email, name, gender, subscription_tier, professional_status, relationship_status) VALUES
  ('test-woman', 'woman@example.com', 'Woman User', 'woman', 'free', 'employed', 'single'),
  ('test-man', 'man@example.com', 'Man User', 'man', 'trial', 'student', 'dating'),
  ('test-nonbinary', 'nb@example.com', 'Non-Binary User', 'non-binary', 'weekly', 'freelancer', 'in-a-relationship'),
  ('test-genderfluid', 'gf@example.com', 'Genderfluid User', 'genderfluid', 'monthly', 'entrepreneur', 'engaged'),
  ('test-agender', 'ag@example.com', 'Agender User', 'agender', 'free', 'retired', 'married'),
  ('test-prefer-not-say', 'pns@example.com', 'Private User', 'prefer-not-to-say', 'trial', 'prefer-not-to-say', 'prefer-not-to-say'),
  ('test-other', 'other@example.com', 'Other User', 'other', 'weekly', 'unemployed', 'its-complicated');

  -- Verify insertions worked
  SELECT id, name, gender, subscription_tier, professional_status, relationship_status 
  FROM users 
  WHERE id LIKE 'test-%'
  ORDER BY id;

  -- Clean up test data
  DELETE FROM users WHERE id LIKE 'test-%';
COMMIT;

-- ============================================================================
-- PHASE 4: JSON DATA STRUCTURE TESTS
-- ============================================================================

-- Test 8: Insert user with complex JSON data
BEGIN;
  INSERT INTO users (
    id, email, name, 
    practice_stats, 
    usage_metrics,
    login_history
  ) VALUES (
    'test-json-user', 
    'json@example.com', 
    'JSON Test User',
    '{
      "totalConversations": 15,
      "completedScenarios": ["cafe-1", "gym-1", "bookstore-1"],
      "voiceMinutes": 45,
      "averageScore": 87.5,
      "improvementRate": 12.3,
      "favoriteScenarios": ["cafe-1"],
      "weakAreas": ["small-talk"],
      "strongAreas": ["confidence", "listening"]
    }',
    '{
      "daily_usage": {"2024-01-15": 5, "2024-01-16": 3},
      "weekly_usage": {"2024-W03": 8},
      "monthly_usage": {"2024-01": 15},
      "feature_usage": {
        "text_chat": 10,
        "voice_practice": 5,
        "feedback_views": 8,
        "scenario_completions": 3
      },
      "engagement_score": 78,
      "last_activity": "2024-01-16T10:30:00Z"
    }',
    ARRAY['{"timestamp": "2024-01-16T10:30:00Z", "user_agent": "Mozilla/5.0"}']::jsonb[]
  );

  -- Test JSON queries
  SELECT 
    id,
    name,
    practice_stats->'totalConversations' as total_conversations,
    practice_stats->'averageScore' as average_score,
    usage_metrics->'engagement_score' as engagement_score,
    usage_metrics->'feature_usage'->'text_chat' as text_chat_usage,
    array_length(login_history, 1) as login_sessions_count
  FROM users 
  WHERE id = 'test-json-user';

  -- Verify JSON data types
  SELECT 
    id,
    jsonb_typeof(practice_stats) as practice_stats_type,
    jsonb_typeof(practice_stats->'totalConversations') as conversations_type,
    jsonb_typeof(usage_metrics->'feature_usage') as feature_usage_type
  FROM users 
  WHERE id = 'test-json-user';

  -- Clean up
  DELETE FROM users WHERE id = 'test-json-user';
COMMIT;

-- ============================================================================
-- PHASE 5: PERFORMANCE TESTS
-- ============================================================================

-- Test 9: Index performance check
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE email = 'test@example.com';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE subscription_tier = 'premium';

EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM users WHERE created_at > NOW() - INTERVAL '7 days';

-- ============================================================================
-- PHASE 6: TRIGGER TESTS
-- ============================================================================

-- Test 10: last_login trigger test
BEGIN;
  INSERT INTO users (id, email, name) 
  VALUES ('test-trigger', 'trigger@example.com', 'Trigger Test');
  
  -- Check initial last_login
  SELECT id, name, last_login, created_at 
  FROM users 
  WHERE id = 'test-trigger';
  
  -- Wait a moment then update (simulating passage of time)
  SELECT pg_sleep(1);
  
  UPDATE users 
  SET name = 'Trigger Test Updated' 
  WHERE id = 'test-trigger';
  
  -- Check if last_login was updated by trigger
  SELECT id, name, last_login, created_at,
    CASE 
      WHEN last_login > created_at 
      THEN '✅ Trigger working - last_login updated'
      ELSE '❌ Trigger not working - last_login not updated'
    END as trigger_status
  FROM users 
  WHERE id = 'test-trigger';
  
  -- Clean up
  DELETE FROM users WHERE id = 'test-trigger';
COMMIT;

-- ============================================================================
-- PHASE 7: RELATIONSHIP TESTS (if you have foreign keys)
-- ============================================================================

-- Test 11: Foreign key constraints (comprehensive schema detection)
DO $$
DECLARE
  users_id_type TEXT;
  conversations_user_id_type TEXT;
  test_user_id TEXT;
  conversation_count INTEGER;
BEGIN
  -- Detect ID types for both tables
  SELECT data_type INTO users_id_type
  FROM information_schema.columns 
  WHERE table_name = 'users' AND column_name = 'id';
  
  SELECT data_type INTO conversations_user_id_type
  FROM information_schema.columns 
  WHERE table_name = 'conversations' AND column_name = 'user_id';
  
  RAISE NOTICE 'Schema detection: users.id = %, conversations.user_id = %', users_id_type, conversations_user_id_type;
  
  -- Insert test data
  INSERT INTO personas (id, name, age, occupation, communication_style, background)
  VALUES ('test-persona-smart', 'Test Persona Smart', 25, 'Test Occupation', 'friendly', 'Test background for smart foreign key testing');
  
  INSERT INTO scenarios (id, title, description, setting, category, difficulty, is_premium, persona_id, image, context)
  VALUES ('test-scenario-smart', 'Test Scenario Smart', 'Test Description', 'Test Setting', 'test', 'beginner', false, 'test-persona-smart', '/test.jpg', 'Test context');
  
  IF users_id_type = 'uuid' AND conversations_user_id_type = 'uuid' THEN
    -- Full UUID schema
    test_user_id := gen_random_uuid()::text;
    
    INSERT INTO users (id, email, name)
    VALUES (test_user_id::uuid, 'smart-uuid@example.com', 'Smart UUID Test User');
    
    INSERT INTO conversations (user_id, scenario_id)
    VALUES (test_user_id::uuid, 'test-scenario-smart');
    
    -- Verify with proper UUID handling
    SELECT COUNT(*) INTO conversation_count
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.email = 'smart-uuid@example.com';
    
    IF conversation_count > 0 THEN
      RAISE NOTICE '✅ UUID-to-UUID foreign key relationship test PASSED';
    ELSE
      RAISE EXCEPTION 'UUID relationship test failed';
    END IF;
    
    -- Test constraint violation
    BEGIN
      INSERT INTO conversations (user_id, scenario_id)
      VALUES (gen_random_uuid(), 'test-scenario-smart');
      RAISE EXCEPTION 'Should have failed with foreign key violation';
    EXCEPTION
      WHEN foreign_key_violation THEN
        RAISE NOTICE '✅ UUID foreign key constraint test PASSED';
    END;
    
    -- Clean up
    DELETE FROM conversations WHERE user_id = test_user_id::uuid;
    DELETE FROM users WHERE id = test_user_id::uuid;
    
  ELSIF users_id_type = 'text' AND conversations_user_id_type = 'text' THEN
    -- Full TEXT schema
    INSERT INTO users (id, email, name)
    VALUES ('test-user-smart', 'smart-text@example.com', 'Smart TEXT Test User');
    
    INSERT INTO conversations (user_id, scenario_id)
    VALUES ('test-user-smart', 'test-scenario-smart');
    
    -- Verify with TEXT handling
    SELECT COUNT(*) INTO conversation_count
    FROM conversations c
    JOIN users u ON c.user_id = u.id
    WHERE u.email = 'smart-text@example.com';
    
    IF conversation_count > 0 THEN
      RAISE NOTICE '✅ TEXT-to-TEXT foreign key relationship test PASSED';
    ELSE
      RAISE EXCEPTION 'TEXT relationship test failed';
    END IF;
    
    -- Test constraint violation
    BEGIN
      INSERT INTO conversations (user_id, scenario_id)
      VALUES ('non-existent-user-id', 'test-scenario-smart');
      RAISE EXCEPTION 'Should have failed with foreign key violation';
    EXCEPTION
      WHEN foreign_key_violation THEN
        RAISE NOTICE '✅ TEXT foreign key constraint test PASSED';
    END;
    
    -- Clean up
    DELETE FROM conversations WHERE user_id = 'test-user-smart';
    DELETE FROM users WHERE id = 'test-user-smart';
    
  ELSIF users_id_type = 'uuid' AND conversations_user_id_type = 'text' THEN
    -- Mixed schema: UUID users, TEXT conversations (needs casting)
    test_user_id := gen_random_uuid()::text;
    
    INSERT INTO users (id, email, name)
    VALUES (test_user_id::uuid, 'smart-mixed@example.com', 'Smart Mixed Test User');
    
    INSERT INTO conversations (user_id, scenario_id)
    VALUES (test_user_id, 'test-scenario-smart');
    
    -- Verify with explicit casting
    SELECT COUNT(*) INTO conversation_count
    FROM conversations c
    JOIN users u ON c.user_id = u.id::text
    WHERE u.email = 'smart-mixed@example.com';
    
    IF conversation_count > 0 THEN
      RAISE NOTICE '✅ UUID-to-TEXT foreign key relationship test PASSED';
    ELSE
      RAISE EXCEPTION 'Mixed schema relationship test failed';
    END IF;
    
    -- Clean up
    DELETE FROM conversations WHERE user_id = test_user_id;
    DELETE FROM users WHERE id = test_user_id::uuid;
    
  ELSE
    -- Other combinations or unknown schema
    RAISE NOTICE '⚠️ Unsupported schema combination: users.id=%, conversations.user_id=%', users_id_type, conversations_user_id_type;
    RAISE NOTICE '💡 Consider running database-schema-fix.sql to standardize your schema';
  END IF;
  
  -- Clean up common test data
  DELETE FROM scenarios WHERE id = 'test-scenario-smart';
  DELETE FROM personas WHERE id = 'test-persona-smart';
  
  RAISE NOTICE '✅ Foreign key constraint tests completed successfully';
  
END $$;

-- ============================================================================
-- PHASE 8: DATA INTEGRITY SUMMARY
-- ============================================================================

-- Test 12: Final integrity check
SELECT 
  'Database Integrity Summary' as test_name,
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM users WHERE profile_completed = true) as completed_profiles,
  (SELECT COUNT(DISTINCT subscription_tier) FROM users) as subscription_tiers,
  (SELECT COUNT(*) FROM users WHERE practice_stats IS NOT NULL) as users_with_stats,
  (SELECT COUNT(*) FROM users WHERE usage_metrics IS NOT NULL) as users_with_metrics;

-- Show sample of data structure
SELECT 
  id,
  name,
  subscription_tier,
  profile_completed,
  jsonb_pretty(practice_stats) as practice_stats_formatted
FROM users 
LIMIT 3;

-- ============================================================================
-- RESULTS INTERPRETATION
-- ============================================================================

/*
EXPECTED RESULTS:

✅ SHOULD PASS:
- All table existence checks
- Valid data insertions with inclusive options
- JSON data structure tests
- Trigger functionality
- Foreign key relationships (if implemented)

❌ SHOULD FAIL:
- Invalid gender constraint violations
- Invalid subscription tier violations
- Invalid professional status violations
- Invalid relationship status violations

📊 PERFORMANCE:
- Index scans should be fast (< 1ms for small datasets)
- JSON queries should execute efficiently
- Bulk operations should scale reasonably

🔧 TROUBLESHOOTING:
If tests fail, check:
1. Migration was run correctly
2. Environment variables are set
3. Supabase project is active
4. Proper permissions are configured
*/
