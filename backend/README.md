# WingMan AI - Modular Voice Agent

A scalable, multi-user social skills coaching voice agent built with LiveKit and modular architecture.

## Architecture Overview

### Modular Structure

```
backend/
├── core/                    # Core business logic
│   ├── types.py            # Data classes and enums
│   ├── persona_registry.py # Persona management
│   ├── session_manager.py  # Multi-user session isolation
│   ├── room_config.py      # Room configuration management
│   └── wingman_agent.py    # Modular agent class
├── personas/               # Individual persona implementations
│   ├── base.py            # Base persona class
│   ├── emma.py            # Coffee shop persona
│   ├── alex.py            # Gym trainer persona
│   ├── maya.py            # Bookstore manager persona
│   ├── jordan.py          # Bar social persona
│   ├── sam.py             # Park walk persona
│   └── dr_chen.py         # Museum professor persona
├── tools/                  # Reusable agent tools
│   └── social_tools.py     # Social skills coaching tools
├── api/                    # API utilities
│   └── room_management.py  # Room and session management
└── wingmanagent.py         # Main entrypoint
```

## Features

### Multi-User Support
- **Isolated Sessions**: Each room has its own session state
- **Concurrent Users**: Multiple users can practice simultaneously
- **User-Specific Data**: Sessions are isolated by room and user ID

### Scalable Personas
- **6 Unique Personas**: Each with distinct personalities and voice models
- **Deepgram Voices**: Different voice models for each persona
- **Scenario-Specific**: Tailored conversations for different social settings

### Voice Models by Persona
- **Emma** (Coffee Shop): `aura-2-stella-en` - Warm, friendly
- **Alex** (Gym): `aura-2-zeus-en` - Energetic, motivational
- **Maya** (Bookstore): `aura-2-luna-en` - Thoughtful, creative
- **Jordan** (Bar): `aura-2-orpheus-en` - Charismatic, social
- **Sam** (Park): `aura-2-aurora-en` - Calm, nature-loving
- **Dr. Chen** (Museum): `aura-2-arcas-en` - Intellectual, knowledgeable

## Configuration

### Environment Variables
```bash
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
GOOGLE_API_KEY=your-google-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

### Room Metadata Format
```json
{
  "scenario": "Coffee Shop",
  "difficulty": "Beginner",
  "user_id": "user123",
  "persona_name": "Emma",
  "voice_model": "aura-2-stella-en"
}
```

## Deployment

### Docker Deployment
```bash
# Build and run
docker-compose up -d

# Scale for multiple instances
docker-compose up -d --scale wingman-agent=3
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: wingman-agent
spec:
  replicas: 3
  selector:
    matchLabels:
      app: wingman-agent
  template:
    spec:
      containers:
      - name: wingman-agent
        image: wingman-agent:latest
        env:
        - name: LIVEKIT_URL
          valueFrom:
            secretKeyRef:
              name: livekit-secrets
              key: url
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
```

## API Usage

### Creating a Room
```python
from api.room_management import room_api

# Create room metadata
metadata = room_api.create_room_metadata(
    scenario="Coffee Shop",
    difficulty="Beginner",
    user_id="user123"
)

# Use metadata when creating LiveKit room
```

### Getting Session Status
```python
status = await room_api.get_session_status("room-name")
print(status)
# {
#   "status": "active",
#   "session_id": "uuid",
#   "conversation_turns": 5,
#   "average_confidence": 7.2,
#   "skills_practiced": ["active listening", "asking questions"]
# }
```

### Available Scenarios
```python
scenarios = room_api.get_available_scenarios()
# Returns list of all scenarios with persona info
```

## Development

### Adding New Personas
1. Create persona class in `personas/` inheriting from `BasePersona`
2. Register in `PersonaRegistry` 
3. Add voice model mapping
4. Update frontend configuration

### Adding New Tools
1. Create tool function with `@function_tool` decorator
2. Add room_name parameter for session isolation
3. Register in `WingManAgent` tools list

### Session Management
- Sessions are automatically created per room
- Data is isolated between rooms/users
- Cleanup happens on room disconnect
- Tools automatically use room-specific session data

## Monitoring

### Health Checks
- Docker healthcheck included
- Session count monitoring
- Room status tracking

### Logging
- Structured logging with room identification
- Session lifecycle events
- Error tracking with cleanup

## Scaling

### Horizontal Scaling
- Multiple agent instances supported
- Load balancing via LiveKit
- Stateless design for easy scaling

### Resource Management
- Memory limits per container
- CPU allocation controls
- Automatic cleanup of inactive sessions
