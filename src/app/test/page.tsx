'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { generateAIResponse } from '@/lib/gemini';

export default function TestPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const testAI = async () => {
    setLoading(true);
    try {
      const result = await generateAIResponse('Hi there!', {
        personality: {
          name: 'Sarah',
          traits: 'Friendly, bookish, wears glasses',
          tone: 'Warm but slightly shy'
        },
        setting: 'A quiet café on a rainy afternoon'
      });
      setResponse(result);
    } catch (error) {
      setResponse('Error: ' + (error as Error).message);
    }
    setLoading(false);
  };

  if (!isLoaded) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-white mb-6">Test Page</h1>
      
      {isSignedIn ? (
        <div className="space-y-6">
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-2">User Info</h2>
            <p className="text-slate-300">Hello, {user?.firstName}!</p>
            <p className="text-slate-400 text-sm">{user?.emailAddresses[0]?.emailAddress}</p>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold text-white mb-4">AI Test</h2>
            <Button 
              onClick={testAI} 
              disabled={loading}
              className="mb-4"
            >
              {loading ? 'Testing...' : 'Test AI Response'}
            </Button>
            
            {response && (
              <div className="mt-4 p-4 bg-slate-700 rounded-lg">
                <h3 className="font-medium text-white mb-2">AI Response:</h3>
                <p className="text-slate-300">{response}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-lg">
          <p className="text-slate-300">Please sign in to test the features.</p>
        </div>
      )}
    </div>
  );
}