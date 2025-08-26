# WingMan AI - Production Deployment Guide

## Quick Start

### 1. Environment Setup
```bash
# Create .env file
LIVEKIT_URL=wss://your-livekit-server.com
LIVEKIT_API_KEY=your-api-key
LIVEKIT_API_SECRET=your-api-secret
GOOGLE_API_KEY=your-google-api-key
DEEPGRAM_API_KEY=your-deepgram-api-key
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json
```

### 2. Docker Deployment
```bash
# Single instance
docker-compose up -d

# Multiple instances for scaling
docker-compose up -d --scale wingman-agent=3
```

### 3. Kubernetes Deployment
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
    metadata:
      labels:
        app: wingman-agent
    spec:
      containers:
      - name: wingman-agent
        image: wingman-ai:latest
        env:
        - name: LIVEKIT_URL
          valueFrom:
            secretKeyRef:
              name: wingman-secrets
              key: livekit-url
        - name: LIVEKIT_API_KEY
          valueFrom:
            secretKeyRef:
              name: wingman-secrets
              key: livekit-api-key
        - name: LIVEKIT_API_SECRET
          valueFrom:
            secretKeyRef:
              name: wingman-secrets
              key: livekit-api-secret
        - name: GOOGLE_API_KEY
          valueFrom:
            secretKeyRef:
              name: wingman-secrets
              key: google-api-key
        - name: DEEPGRAM_API_KEY
          valueFrom:
            secretKeyRef:
              name: wingman-secrets
              key: deepgram-api-key
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
        ports:
        - containerPort: 8080
---
apiVersion: v1
kind: Service
metadata:
  name: wingman-service
spec:
  selector:
    app: wingman-agent
  ports:
  - port: 80
    targetPort: 8080
  type: LoadBalancer
```

## Persona Configuration

### Available Personas & Voice Models

| Scenario | Persona | Voice Model | Personality |
|----------|---------|-------------|-------------|
| Coffee Shop | Emma | aura-2-stella-en | Warm, friendly, intellectual |
| Gym | Alex | aura-2-zeus-en | Energetic, motivational |
| Bookstore | Maya | aura-2-luna-en | Thoughtful, creative |
| Bar Social | Jordan | aura-2-orpheus-en | Charismatic, social |
| Park Walk | Sam | aura-2-aurora-en | Calm, nature-loving |
| Museum | Dr. Chen | aura-2-arcas-en | Intellectual, knowledgeable |

### Frontend Integration

```typescript
// Example room creation with metadata
const roomMetadata = {
  scenario: "Coffee Shop",
  difficulty: "Beginner", 
  user_id: "user123",
  persona_name: "Emma",
  voice_model: "aura-2-stella-en"
};

// Create LiveKit room with metadata
const room = await livekitClient.createRoom({
  name: `wingman-${Date.now()}`,
  metadata: JSON.stringify(roomMetadata)
});
```

## Scaling Strategies

### Horizontal Scaling
- Multiple agent containers
- Load balancing via LiveKit
- Session isolation per room
- Stateless design

### Resource Management
```yaml
resources:
  requests:
    memory: "1Gi"      # Minimum memory
    cpu: "500m"        # 0.5 CPU cores
  limits:
    memory: "2Gi"      # Maximum memory
    cpu: "1000m"       # 1 CPU core
```

### Auto-scaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: wingman-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: wingman-agent
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## Monitoring & Observability

### Health Checks
```bash
# Container health check
curl http://localhost:8080/health

# Session monitoring
curl http://localhost:8080/sessions/status
```

### Logging
- Structured JSON logs
- Room-specific identifiers
- Session lifecycle events
- Performance metrics

### Metrics to Track
- Active sessions count
- Average session duration
- Conversation turns per session
- Voice latency
- Error rates
- Resource utilization

## Security

### API Key Management
```bash
# Use secrets management
kubectl create secret generic wingman-secrets \
  --from-literal=livekit-api-key=$LIVEKIT_API_KEY \
  --from-literal=deepgram-api-key=$DEEPGRAM_API_KEY
```

### Network Security
- TLS/SSL for all communications
- VPC isolation
- Firewall rules
- Rate limiting

## Troubleshooting

### Common Issues

1. **Import Errors**
   ```bash
   # Check Python path
   export PYTHONPATH=/app
   ```

2. **Voice Model Issues**
   ```bash
   # Verify Deepgram API key
   curl -H "Authorization: Token $DEEPGRAM_API_KEY" \
        https://api.deepgram.com/v1/projects
   ```

3. **Session Isolation**
   ```bash
   # Check active sessions
   python -c "from core.session_manager import session_manager; print(session_manager.get_active_rooms())"
   ```

### Debug Mode
```bash
# Enable debug logging
export LOG_LEVEL=DEBUG
python wingmanagent.py
```

## Performance Optimization

### Memory Management
- Session cleanup on disconnect
- Garbage collection tuning
- Resource monitoring

### Voice Processing
- Deepgram model optimization
- Audio streaming configuration
- Latency reduction

### Scaling Recommendations
- Start with 2-3 replicas
- Monitor CPU/memory usage
- Scale based on active sessions
- Use dedicated nodes for voice processing
