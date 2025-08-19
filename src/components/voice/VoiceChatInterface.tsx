// components/voice/VoiceChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface Scenario {
  id: string;
  title: string;
  setting: string;
  personality: {
    name: string;
  };
}

export function VoiceChatInterface({ scenario }: { scenario: Scenario }) {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const { status, isAgentSpeaking, connect, disconnect, toggleMute, isMuted } = useVoiceSession();

  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      // Generate token and connect
      const tokenResponse = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `wingman-${scenario.id}-${Date.now()}`,
          participantName: `user-${Date.now()}`,
          metadata: {
            scenario: scenario.title,
            difficulty: 'beginner', // default difficulty
          }
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get room token');
      }
      
      const { token, roomName } = await tokenResponse.json();
      await connect(roomName, token);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setConnectionStatus('disconnected');
  };

  // Update connection status based on voice session status
  useEffect(() => {
    if (status === 'connected') {
      setConnectionStatus('connected');
    } else if (status === 'connecting') {
      setConnectionStatus('connecting');
    } else if (status === 'error') {
      setConnectionStatus('error');
    } else {
      setConnectionStatus('disconnected');
    }
  }, [status]);

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="p-6 bg-black bg-opacity-20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{scenario.title}</h2>
            <p className="text-indigo-200">{scenario.setting}</p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-400' :
              connectionStatus === 'connecting' ? 'bg-yellow-400' :
              'bg-red-400'
            }`}></div>
            <span className="text-white text-sm capitalize">{connectionStatus}</span>
          </div>
        </div>
      </div>

      {/* Visualizer */}
      <div className="flex-1 flex items-center justify-center">
        <motion.div 
          className="w-32 h-32 bg-white bg-opacity-20 rounded-full flex items-center justify-center"
          animate={isAgentSpeaking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isAgentSpeaking ? Infinity : 0 }}
        >
          <div className="text-center">
            <Mic className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-sm">
              {status === 'connected' ? 'Listening...' : 'Ready to connect'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black bg-opacity-20">
        <div className="flex justify-center items-center gap-4">
          {status !== 'connected' ? (
            <Button 
              onClick={handleConnect}
              className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full"
              size="lg"
            >
              <Mic className="w-5 h-5 mr-2" />
              Start Voice Chat
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? "destructive" : "secondary"}
                size="lg"
                className="rounded-full p-4"
              >
                {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </Button>
              
              <Button
                onClick={handleDisconnect}
                variant="destructive"
                size="lg"
                className="rounded-full p-4"
              >
                <PhoneOff className="w-6 h-6" />
              </Button>
            </>
          )}
        </div>
        
        {status === 'connected' && (
          <div className="mt-4 text-center">
            <p className="text-indigo-200 text-sm">
              Talking to {scenario.personality.name} • {scenario.setting}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}