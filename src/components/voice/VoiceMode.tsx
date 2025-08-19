'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Voice persona configurations matching backend
export const VOICE_PERSONAS = {
  'cafe-1': {
    name: 'Emma',
    gender: 'female',
    voice: 'en-US-Neural2-F',
    personality: 'Friendly, intellectual, slightly shy but warming up',
    description: 'A 24-year-old graduate student in Literature who loves coffee shops'
  },
  'gym-1': {
    name: 'Alex',
    gender: 'male',
    voice: 'en-US-Neural2-D',
    personality: 'Energetic, motivational, health-conscious',
    description: 'A 28-year-old personal trainer who helps newcomers'
  },
  'bookstore-1': {
    name: 'Maya',
    gender: 'female',
    voice: 'en-US-Neural2-H',
    personality: 'Creative, thoughtful, passionate about literature',
    description: 'A 26-year-old bookstore manager and aspiring writer'
  },
  'bar-1': {
    name: 'Jordan',
    gender: 'male',
    voice: 'en-US-Neural2-J',
    personality: 'Outgoing, witty, social, enjoys meeting new people',
    description: 'A 30-year-old marketing professional out for drinks'
  },
  'park-1': {
    name: 'Sam',
    gender: 'female',
    voice: 'en-US-Neural2-C',
    personality: 'Nature-loving, calm, thoughtful',
    description: 'A 25-year-old environmental scientist who loves nature'
  },
  'museum-1': {
    name: 'Dr. Chen',
    gender: 'male',
    voice: 'en-US-Neural2-A',
    personality: 'Knowledgeable, passionate about art, patient educator',
    description: 'A 32-year-old art history professor'
  }
} as const;

// Helper function to get scenario display name
function getScenarioDisplayName(scenarioId: string): string {
  const persona = VOICE_PERSONAS[scenarioId as keyof typeof VOICE_PERSONAS];
  if (persona) {
    return scenarioId.split('-')[0].charAt(0).toUpperCase() + scenarioId.split('-')[0].slice(1);
  }
  return scenarioId;
}

interface VoiceModeProps {
  scenarioId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  userId: string;
  onClose: () => void;
}

interface VoiceConnectionState {
  status: 'disconnected' | 'connecting' | 'connected' | 'error';
  room?: any;
  token?: string;
}

export function VoiceMode({ scenarioId, difficulty, userId, onClose }: VoiceModeProps) {
  const [connectionState, setConnectionState] = useState<VoiceConnectionState>({
    status: 'disconnected'
  });
  const [isMuted, setIsMuted] = useState(false);
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);
  const [transcript, setTranscript] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  
  const roomRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  
  // Get persona for this scenario
  const persona = VOICE_PERSONAS[scenarioId as keyof typeof VOICE_PERSONAS];
  
  const startVoiceSession = async () => {
    try {
      setConnectionState({ status: 'connecting' });
      
      // Generate room token
      const tokenResponse = await fetch('/api/voice/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `wingman-${scenarioId}-${Date.now()}`,
          participantName: `user-${userId}`,
          metadata: {
            scenario: getScenarioDisplayName(scenarioId),
            difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
            user_id: userId,
            persona: persona.name
          }
        })
      });
      
      if (!tokenResponse.ok) {
        throw new Error('Failed to get room token');
      }
      
      const { token, roomName } = await tokenResponse.json();
      
      // Import LiveKit dynamically
      const { Room, RoomEvent, Track } = await import('livekit-client');
      
      // Create and connect to room
      const room = new Room({
        adaptiveStream: true,
        dynacast: true,
        publishDefaults: {
          audioPreset: {
            maxBitrate: 64000,
          }
        }
      });
      
      // Set up event listeners
      room.on(RoomEvent.Connected, () => {
        console.log('✅ Connected to voice session');
        setConnectionState({ status: 'connected', room, token });
      });
      
      room.on(RoomEvent.Disconnected, () => {
        console.log('❌ Disconnected from voice session');
        setConnectionState({ status: 'disconnected' });
      });
      
      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.isAgent) {
          console.log('🤖 Agent audio track subscribed');
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();
        }
      });
      
      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          
          if (data.type === 'transcript') {
            setTranscript(prev => [...prev, `${data.speaker}: ${data.text}`]);
          } else if (data.type === 'feedback') {
            setFeedback(prev => [...prev, data.feedback]);
          } else if (data.type === 'agent_speaking') {
            setIsAgentSpeaking(data.speaking);
          }
        } catch (e) {
          console.warn('Failed to parse data message:', e);
        }
      });
      
      // Connect to room
      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      
      // Enable microphone
      await room.localParticipant.setMicrophoneEnabled(true);
      
      roomRef.current = room;
      
    } catch (error) {
      console.error('Failed to start voice session:', error);
      setConnectionState({ status: 'error' });
    }
  };
  
  const endVoiceSession = async () => {
    if (roomRef.current) {
      await roomRef.current.disconnect();
      roomRef.current = null;
    }
    setConnectionState({ status: 'disconnected' });
    setTranscript([]);
    setFeedback([]);
  };
  
  const toggleMute = async () => {
    if (roomRef.current) {
      if (isMuted) {
        await roomRef.current.localParticipant.setMicrophoneEnabled(true);
      } else {
        await roomRef.current.localParticipant.setMicrophoneEnabled(false);
      }
      setIsMuted(!isMuted);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        className="bg-slate-800 rounded-xl p-6 w-full max-w-md mx-4 border border-slate-700"
      >
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">
            Voice Practice with {persona?.name}
          </h2>
          <p className="text-slate-400 text-sm">
            {persona?.description}
          </p>
        </div>

        {/* Connection Status */}
        <div className="flex items-center justify-center mb-6">
          {connectionState.status === 'connecting' && (
            <div className="flex items-center text-yellow-400">
              <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mr-2"></div>
              Connecting...
            </div>
          )}
          {connectionState.status === 'connected' && (
            <div className="flex items-center text-green-400">
              <div className="w-4 h-4 bg-green-400 rounded-full mr-2"></div>
              Connected
            </div>
          )}
          {connectionState.status === 'error' && (
            <div className="flex items-center text-red-400">
              <div className="w-4 h-4 bg-red-400 rounded-full mr-2"></div>
              Connection Error
            </div>
          )}
          {connectionState.status === 'disconnected' && (
            <div className="flex items-center text-slate-400">
              <div className="w-4 h-4 bg-slate-400 rounded-full mr-2"></div>
              Disconnected
            </div>
          )}
        </div>

        {/* Voice Controls */}
        <div className="flex justify-center space-x-4 mb-6">
          {connectionState.status === 'disconnected' ? (
            <Button
              onClick={startVoiceSession}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2"
            >
              <Phone className="w-4 h-4 mr-2" />
              Start Voice Session
            </Button>
          ) : (
            <>
              <Button
                onClick={toggleMute}
                variant={isMuted ? "outline" : "default"}
                size="sm"
                className={isMuted ? "border-red-500 text-red-400" : "bg-blue-600 hover:bg-blue-700"}
              >
                {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </Button>
              
              <Button
                onClick={endVoiceSession}
                variant="outline"
                size="sm"
                className="border-red-500 text-red-400 hover:bg-red-500/10"
              >
                <PhoneOff className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Agent Speaking Indicator */}
        {isAgentSpeaking && (
          <div className="flex items-center justify-center mb-4 text-purple-400">
            <Volume2 className="w-4 h-4 mr-2 animate-pulse" />
            {persona?.name} is speaking...
          </div>
        )}

        {/* Transcript */}
        {transcript.length > 0 && (
          <div className="bg-slate-900 rounded-lg p-4 mb-4 max-h-32 overflow-y-auto">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Conversation</h3>
            {transcript.map((message, index) => (
              <div key={index} className="text-xs text-slate-400 mb-1">
                {message}
              </div>
            ))}
          </div>
        )}

        {/* Feedback */}
        {feedback.length > 0 && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 mb-4">
            <h3 className="text-sm font-medium text-blue-400 mb-2">Feedback</h3>
            {feedback.map((item, index) => (
              <div key={index} className="text-xs text-slate-300 mb-1">
                {typeof item === 'string' ? item : JSON.stringify(item)}
              </div>
            ))}
          </div>
        )}

        {/* Close Button */}
        <div className="flex justify-end">
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="text-slate-400 hover:text-white"
          >
            Close
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}