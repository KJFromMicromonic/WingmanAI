// components/voice/VoiceChatInterface.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useVoiceRoleplay } from '@/hooks/useVoiceRoleplay';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import { motion } from 'framer-motion';

export function VoiceChatInterface({ scenario }: { scenario: any }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  
  const { connect, disconnect, toggleMute } = useVoiceRoleplay();

  const handleConnect = async () => {
    try {
      setConnectionStatus('connecting');
      await connect(scenario.id);
      setIsConnected(true);
      setConnectionStatus('connected');
    } catch (error) {
      setConnectionStatus('error');
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    setIsConnected(false);
    setConnectionStatus('disconnected');
  };

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
          animate={isSpeaking ? { scale: [1, 1.1, 1] } : {}}
          transition={{ duration: 0.5, repeat: isSpeaking ? Infinity : 0 }}
        >
          <div className="text-center">
            <Mic className="w-8 h-8 text-white mx-auto mb-2" />
            <p className="text-white text-sm">
              {isConnected ? 'Listening...' : 'Ready to connect'}
            </p>
          </div>
        </motion.div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black bg-opacity-20">
        <div className="flex justify-center items-center gap-4">
          {!isConnected ? (
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
                onClick={() => {
                  toggleMute();
                  setIsMuted(!isMuted);
                }}
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
        
        {isConnected && (
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