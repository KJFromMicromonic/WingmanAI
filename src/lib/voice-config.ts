export const VOICE_AGENT_CONFIG = {
    // Mapping scenario IDs to LiveKit room configurations with Deepgram voices
    scenarioConfigs: {
      'cafe-1': {
        agentName: 'wingman-emma',
        scenario: 'Coffee Shop',
        persona: 'Emma',
        voice: 'aura-2-stella-en', // Warm, friendly female voice
        description: 'Practice casual conversation in a coffee shop setting'
      },
      'gym-1': {
        agentName: 'wingman-alex',
        scenario: 'Gym',
        persona: 'Alex', 
        voice: 'aura-2-zeus-en', // Energetic, motivational voice
        description: 'Practice fitness-focused conversations with a trainer'
      },
      'bookstore-1': {
        agentName: 'wingman-maya',
        scenario: 'Bookstore',
        persona: 'Maya',
        voice: 'aura-2-luna-en', // Thoughtful, creative female voice
        description: 'Practice literary discussions in a bookstore'
      },
      'bar-1': {
        agentName: 'wingman-jordan',
        scenario: 'Bar Social',
        persona: 'Jordan',
        voice: 'aura-2-orpheus-en', // Charismatic, social voice
        description: 'Practice social networking in a bar setting'
      },
      'park-1': {
        agentName: 'wingman-sam',
        scenario: 'Park Walk',
        persona: 'Sam',
        voice: 'aura-2-aurora-en', // Calm, nature-loving voice
        description: 'Practice mindful conversations during a nature walk'
      },
      'museum-1': {
        agentName: 'wingman-chen',
        scenario: 'Museum',
        persona: 'Dr. Chen',
        voice: 'aura-2-arcas-en', // Intellectual, knowledgeable voice
        description: 'Practice intellectual discussions about art and culture'
      }
    },
  
    // Voice quality settings
    audioSettings: {
      sampleRate: 48000,
      channels: 1,
      bitrate: 64000,
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true
    },
  
    // Session settings
    sessionSettings: {
      maxDuration: 1800, // 30 minutes
      reconnectAttempts: 3,
      reconnectDelay: 2000,
      heartbeatInterval: 30000
    }
  };
  