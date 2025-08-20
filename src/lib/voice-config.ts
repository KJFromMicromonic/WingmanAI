export const VOICE_AGENT_CONFIG = {
    // Mapping scenario IDs to LiveKit room configurations
    scenarioConfigs: {
      'cafe-1': {
        agentName: 'wingman-emma',
        scenario: 'Cafe Redezvous',
        persona: 'Emma',
        voice: 'en-US-Neural2-F',
        description: 'Practice casual conversation in a coffee shop setting'
      },
      'gym-1': {
        agentName: 'wingman-taylor',
        scenario: 'Gym Approach',
        persona: 'Taylor', 
        voice: 'en-US-Neural2-D',
        description: 'Practice fitness-focused conversations with a trainer'
      },
      'bookstore-1': {
        agentName: 'wingman-sam',
        scenario: 'Bookstore Browse',
        persona: 'Sam',
        voice: 'en-US-Neural2-H',
        description: 'Practice literary discussions in a bookstore'
      },
      'bar-1': {
        agentName: 'wingman-jordan',
        scenario: 'Bar Pickup',
        persona: 'Jordan',
        voice: 'en-US-Neural2-J',
        description: 'Practice social networking in a bar setting'
      },
      'park-1': {
        agentName: 'wingman-alex',
        scenario: 'Park Walk',
        persona: 'Alex',
        voice: 'en-US-Neural2-C',
        description: 'Practice mindful conversations during a nature walk'
      },
      'museum-1': {
        agentName: 'wingman-chen',
        scenario: 'Museum Gallery',
        persona: 'Dr. Chen',
        voice: 'en-US-Neural2-A',
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
  