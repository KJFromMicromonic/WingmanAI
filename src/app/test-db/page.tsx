'use client';

import { useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { 
  createUser, 
  getUser, 
  updateUserProfile, 
  updateUsageMetrics, 
  updatePracticeStats,
  getUserDashboardData,
  ProfileUpdateData 
} from '@/lib/user';
import { SubscriptionTier } from '@/lib/supabase/types';

interface TestResult {
  name: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  duration?: number;
}

export default function DatabaseTestPage() {
  const { user: clerkUser } = useUser();
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const updateResult = (name: string, updates: Partial<TestResult>) => {
    setResults(prev => prev.map(r => 
      r.name === name ? { ...r, ...updates } : r
    ));
  };

  // Phase 1: Basic Connectivity Tests
  const testSupabaseConnection = async () => {
    const startTime = Date.now();
    addResult({ name: 'Supabase Connection', status: 'pending', message: 'Testing connection...' });
    
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('users').select('count').limit(1);
      
      if (error) {
        updateResult('Supabase Connection', {
          status: 'error',
          message: `Connection failed: ${error.message}`,
          duration: Date.now() - startTime
        });
        return false;
      }
      
      updateResult('Supabase Connection', {
        status: 'success',
        message: 'Connection successful',
        duration: Date.now() - startTime
      });
      return true;
    } catch (err) {
      updateResult('Supabase Connection', {
        status: 'error',
        message: `Error: ${err}`,
        duration: Date.now() - startTime
      });
      return false;
    }
  };

  // Phase 2: Schema Validation
  const testDatabaseSchema = async () => {
    const startTime = Date.now();
    addResult({ name: 'Database Schema', status: 'pending', message: 'Validating schema...' });
    
    try {
      const supabase = createClient();
      
      // Test that we can query the users table with all required columns
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email, name, profile_completed, subscription_tier, onboarding_completed, practice_stats, usage_metrics')
        .limit(1);
      
      if (userError && userError.code !== 'PGRST116') { // PGRST116 = no rows found (which is OK)
        updateResult('Database Schema', {
          status: 'error',
          message: `Users table schema error: ${userError.message}`,
          duration: Date.now() - startTime
        });
        return false;
      }
      
      // Test scenarios table
      const { data: scenarioData, error: scenarioError } = await supabase
        .from('scenarios')
        .select('id, title, difficulty, is_premium')
        .limit(1);
      
      if (scenarioError && scenarioError.code !== 'PGRST116') {
        updateResult('Database Schema', {
          status: 'error',
          message: `Scenarios table schema error: ${scenarioError.message}`,
          duration: Date.now() - startTime
        });
        return false;
      }
      
      // Test conversations table
      const { data: conversationData, error: conversationError } = await supabase
        .from('conversations')
        .select('id, user_id, scenario_id, completed')
        .limit(1);
      
      if (conversationError && conversationError.code !== 'PGRST116') {
        updateResult('Database Schema', {
          status: 'error',
          message: `Conversations table schema error: ${conversationError.message}`,
          duration: Date.now() - startTime
        });
        return false;
      }
      
      updateResult('Database Schema', {
        status: 'success',
        message: 'All required tables and columns exist and are accessible',
        duration: Date.now() - startTime
      });
      return true;
    } catch (err) {
      updateResult('Database Schema', {
        status: 'error',
        message: `Schema validation error: ${err}`,
        duration: Date.now() - startTime
      });
      return false;
    }
  };

  // Phase 3: User CRUD Operations
  const testUserOperations = async () => {
    if (!clerkUser) {
      addResult({ 
        name: 'User Operations', 
        status: 'error', 
        message: 'No Clerk user found - please sign in first' 
      });
      return false;
    }

    // Test User Creation
    const startTime = Date.now();
    addResult({ name: 'User Creation', status: 'pending', message: 'Creating test user...' });
    
    try {
      const userData = await createUser(clerkUser, 'trial');
      
      if (userData) {
        updateResult('User Creation', {
          status: 'success',
          message: `User created: ${userData.name} (${userData.subscription_tier})`,
          duration: Date.now() - startTime
        });
      } else {
        updateResult('User Creation', {
          status: 'error',
          message: 'User creation returned null',
          duration: Date.now() - startTime
        });
        return false;
      }
    } catch (error) {
      updateResult('User Creation', {
        status: 'error',
        message: `User creation failed: ${error}`,
        duration: Date.now() - startTime
      });
      return false;
    }

    // Test User Retrieval
    const retrievalStartTime = Date.now();
    addResult({ name: 'User Retrieval', status: 'pending', message: 'Retrieving user data...' });
    
    try {
      const retrievedUser = await getUser(clerkUser.id);
      
      if (retrievedUser) {
        updateResult('User Retrieval', {
          status: 'success',
          message: `User retrieved: ${retrievedUser.name}`,
          duration: Date.now() - retrievalStartTime
        });
      } else {
        updateResult('User Retrieval', {
          status: 'error',
          message: 'User not found after creation',
          duration: Date.now() - retrievalStartTime
        });
        return false;
      }
    } catch (error) {
      updateResult('User Retrieval', {
        status: 'error',
        message: `User retrieval failed: ${error}`,
        duration: Date.now() - retrievalStartTime
      });
      return false;
    }

    return true;
  };

  // Phase 4: Profile Management
  const testProfileOperations = async () => {
    if (!clerkUser) return false;

    const startTime = Date.now();
    addResult({ name: 'Profile Update', status: 'pending', message: 'Updating profile...' });
    
    try {
      const profileData: ProfileUpdateData = {
        name: 'Test User Updated',
        professional_status: 'student',
        gender: 'non-binary',
        relationship_status: 'single',
        date_of_birth: '1995-06-15'
      };

      const success = await updateUserProfile(clerkUser.id, profileData);
      
      if (success) {
        updateResult('Profile Update', {
          status: 'success',
          message: 'Profile updated successfully',
          duration: Date.now() - startTime
        });

        // Verify the update
        const updatedUser = await getUser(clerkUser.id);
        if (updatedUser?.gender === 'non-binary' && updatedUser?.professional_status === 'student') {
          addResult({
            name: 'Profile Verification',
            status: 'success',
            message: 'Profile changes verified in database'
          });
        } else {
          addResult({
            name: 'Profile Verification',
            status: 'error',
            message: 'Profile changes not reflected in database'
          });
        }
      } else {
        updateResult('Profile Update', {
          status: 'error',
          message: 'Profile update failed',
          duration: Date.now() - startTime
        });
        return false;
      }
    } catch (error) {
      updateResult('Profile Update', {
        status: 'error',
        message: `Profile update error: ${error}`,
        duration: Date.now() - startTime
      });
      return false;
    }

    return true;
  };

  // Phase 5: Usage Metrics and Analytics
  const testAnalytics = async () => {
    if (!clerkUser) return false;

    // Test usage metrics
    const metricsStartTime = Date.now();
    addResult({ name: 'Usage Metrics', status: 'pending', message: 'Testing usage tracking...' });
    
    try {
      await updateUsageMetrics(clerkUser.id, 'text_chat', 5);
      await updateUsageMetrics(clerkUser.id, 'voice_practice', 2);
      
      updateResult('Usage Metrics', {
        status: 'success',
        message: 'Usage metrics updated successfully',
        duration: Date.now() - metricsStartTime
      });
    } catch (error) {
      updateResult('Usage Metrics', {
        status: 'error',
        message: `Usage metrics failed: ${error}`,
        duration: Date.now() - metricsStartTime
      });
      return false;
    }

    // Test practice stats
    const practiceStartTime = Date.now();
    addResult({ name: 'Practice Stats', status: 'pending', message: 'Testing practice tracking...' });
    
    try {
      await updatePracticeStats(clerkUser.id, 'cafe-1', 85, 300); // 5 min session, 85% score
      
      updateResult('Practice Stats', {
        status: 'success',
        message: 'Practice stats updated successfully',
        duration: Date.now() - practiceStartTime
      });
    } catch (error) {
      updateResult('Practice Stats', {
        status: 'error',
        message: `Practice stats failed: ${error}`,
        duration: Date.now() - practiceStartTime
      });
      return false;
    }

    // Test dashboard data
    const dashboardStartTime = Date.now();
    addResult({ name: 'Dashboard Data', status: 'pending', message: 'Fetching dashboard data...' });
    
    try {
      const dashboardData = await getUserDashboardData(clerkUser.id);
      
      if (dashboardData) {
        updateResult('Dashboard Data', {
          status: 'success',
          message: `Dashboard data retrieved: ${dashboardData.totalConversations} conversations, Level ${dashboardData.level.level}`,
          duration: Date.now() - dashboardStartTime
        });
      } else {
        updateResult('Dashboard Data', {
          status: 'error',
          message: 'Dashboard data returned null',
          duration: Date.now() - dashboardStartTime
        });
        return false;
      }
    } catch (error) {
      updateResult('Dashboard Data', {
        status: 'error',
        message: `Dashboard data failed: ${error}`,
        duration: Date.now() - dashboardStartTime
      });
      return false;
    }

    return true;
  };

  // Phase 6: Performance Testing
  const testPerformance = async () => {
    if (!clerkUser) return false;

    const startTime = Date.now();
    addResult({ name: 'Performance Test', status: 'pending', message: 'Testing bulk operations...' });
    
    try {
      // Test 10 rapid usage updates
      for (let i = 0; i < 10; i++) {
        await updateUsageMetrics(clerkUser.id, 'text_chat', 1);
      }
      
      const duration = Date.now() - startTime;
      const passed = duration < 5000; // Should complete in under 5 seconds
      
      updateResult('Performance Test', {
        status: passed ? 'success' : 'error',
        message: `10 bulk operations completed in ${duration}ms ${passed ? '(PASS)' : '(FAIL - too slow)'}`,
        duration
      });
      
      return passed;
    } catch (error) {
      updateResult('Performance Test', {
        status: 'error',
        message: `Performance test failed: ${error}`,
        duration: Date.now() - startTime
      });
      return false;
    }
  };

  // Phase 7: Error Handling
  const testErrorHandling = async () => {
    const startTime = Date.now();
    addResult({ name: 'Error Handling', status: 'pending', message: 'Testing error scenarios...' });
    
    try {
      // Test with invalid user ID
      const result = await getUser('non-existent-user-id-12345');
      
      if (result === null) {
        updateResult('Error Handling', {
          status: 'success',
          message: 'Correctly handled invalid user ID (returned null)',
          duration: Date.now() - startTime
        });
      } else {
        updateResult('Error Handling', {
          status: 'error',
          message: 'Should return null for invalid user ID',
          duration: Date.now() - startTime
        });
        return false;
      }
    } catch (error) {
      updateResult('Error Handling', {
        status: 'success',
        message: 'Error handled gracefully with exception',
        duration: Date.now() - startTime
      });
    }

    return true;
  };

  // Run All Tests
  const runAllTests = async () => {
    if (isRunning) return;
    
    setIsRunning(true);
    setResults([]);

    console.log('🚀 Starting comprehensive database tests...');

    try {
      // Phase 1: Basic connectivity
      await testSupabaseConnection();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 2: Schema validation
      await testDatabaseSchema();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 3: User operations
      await testUserOperations();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 4: Profile management
      await testProfileOperations();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 5: Analytics
      await testAnalytics();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 6: Performance
      await testPerformance();
      await new Promise(resolve => setTimeout(resolve, 500));

      // Phase 7: Error handling
      await testErrorHandling();

      console.log('✅ All tests completed!');
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      addResult({
        name: 'Test Suite',
        status: 'error',
        message: `Test suite failed: ${error}`
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'pending': return '⏳';
      default: return '⏳';
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-400';
      case 'error': return 'text-red-400';
      case 'pending': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const totalTests = results.length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">
            🧪 Database Testing Dashboard
          </h1>
          <p className="text-slate-300 mb-6">
            Comprehensive testing of Supabase integration and user profile management
          </p>

          {clerkUser ? (
            <div className="text-green-400 mb-4">
              ✅ Signed in as: {clerkUser.emailAddresses[0]?.emailAddress}
            </div>
          ) : (
            <div className="text-red-400 mb-4">
              ❌ Please sign in to run user-related tests
            </div>
          )}

          <Button 
            onClick={runAllTests}
            disabled={isRunning}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 px-8 py-3 text-lg"
          >
            {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
          </Button>
        </div>

        {/* Test Results Summary */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-white">{totalTests}</div>
                <div className="text-slate-400">Total Tests</div>
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-green-400">{successCount}</div>
                <div className="text-slate-400">Passed</div>
              </div>
            </div>
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="text-center">
                <div className="text-3xl font-bold text-red-400">{errorCount}</div>
                <div className="text-slate-400">Failed</div>
              </div>
            </div>
          </div>
        )}

        {/* Test Results */}
        <div className="space-y-4">
          {results.map((result, index) => (
            <div key={index} className="bg-slate-800 p-6 rounded-xl border border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-3">{getStatusIcon(result.status)}</span>
                  {result.name}
                </h3>
                {result.duration && (
                  <span className="text-slate-400 text-sm">
                    {result.duration}ms
                  </span>
                )}
              </div>
              <p className={`${getStatusColor(result.status)} text-sm`}>
                {result.message}
              </p>
            </div>
          ))}
        </div>

        {results.length === 0 && !isRunning && (
          <div className="text-center text-slate-400 mt-8">
            Click "Run All Tests" to start the comprehensive database testing suite
          </div>
        )}
      </div>
    </div>
  );
}
