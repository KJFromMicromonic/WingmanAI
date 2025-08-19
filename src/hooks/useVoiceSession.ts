import { useState, useEffect, useCallback } from 'react';
import { Room, RoomEvent, Track } from 'livekit-client';

interface VoiceSessionState {
  status: 'idle' | 'connecting' | 'connected' | 'error' | 'disconnected';
  room: Room | null;
  isAgentSpeaking: boolean;
  transcript: string[];
  feedback: any[];
  error: string | null;
}

export function useVoiceSession() {
  const [state, setState] = useState<VoiceSessionState>({
    status: 'idle',
    room: null,
    isAgentSpeaking: false,
    transcript: [],
    feedback: [],
    error: null
  });

  const connect = useCallback(async (roomName: string, token: string) => {
    try {
      setState(prev => ({ ...prev, status: 'connecting', error: null }));

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
        setState(prev => ({ ...prev, status: 'connected', room }));
      });

      room.on(RoomEvent.Disconnected, () => {
        setState(prev => ({ 
          ...prev, 
          status: 'disconnected', 
          room: null,
          isAgentSpeaking: false 
        }));
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === Track.Kind.Audio && participant.isAgent) {
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          audioElement.play();
        }
      });

      room.on(RoomEvent.DataReceived, (payload, participant) => {
        try {
          const data = JSON.parse(new TextDecoder().decode(payload));
          
          setState(prev => {
            const newState = { ...prev };
            
            if (data.type === 'transcript') {
              newState.transcript = [...prev.transcript, `${data.speaker}: ${data.text}`];
            } else if (data.type === 'feedback') {
              newState.feedback = [...prev.feedback, data.feedback];
            } else if (data.type === 'agent_speaking') {
              newState.isAgentSpeaking = data.speaking;
            }
            
            return newState;
          });
        } catch (e) {
          console.warn('Failed to parse data message:', e);
        }
      });

      await room.connect(process.env.NEXT_PUBLIC_LIVEKIT_URL!, token);
      await room.localParticipant.setMicrophoneEnabled(true);

    } catch (error) {
      console.error('Connection failed:', error);
      setState(prev => ({ 
        ...prev, 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Connection failed'
      }));
    }
  }, []);

  const disconnect = useCallback(async () => {
    if (state.room) {
      await state.room.disconnect();
    }
  }, [state.room]);

  const toggleMute = useCallback(async () => {
    if (state.room) {
      const isMuted = !state.room.localParticipant.isMicrophoneEnabled;
      await state.room.localParticipant.setMicrophoneEnabled(isMuted);
    }
  }, [state.room]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.room) {
        state.room.disconnect();
      }
    };
  }, [state.room]);

  return {
    ...state,
    connect,
    disconnect,
    toggleMute,
    isMuted: state.room ? !state.room.localParticipant.isMicrophoneEnabled : false
  };
}