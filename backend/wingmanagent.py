#!/usr/bin/env python3
"""
WingMan AI Voice Agent - Modular Multi-User Implementation
Based on actual LiveKit Agents documentation with horizontal scaling support
"""

import asyncio
import os
import json
import dotenv
import logging
from typing import Dict, Optional

from livekit import agents
from livekit.agents import (
    AgentSession, 
    JobContext, 
    WorkerOptions, 
    RoomInputOptions
)
from livekit import rtc
from livekit.plugins import google, silero, elevenlabs

# Import modular components
from core.types import ScenarioType, DifficultyLevel
from core.session_manager import session_manager
from core.room_config import room_config_manager
from core.wingman_agent import WingManAgent
from core.persona_registry import PersonaRegistry

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def parse_room_config(ctx: JobContext) -> Dict:
    """Parse room configuration from metadata with fallbacks"""
    config = {}
    
    # Wait a moment for participants to join and then get their metadata
    await asyncio.sleep(1)
    
    for participant in ctx.room.remote_participants.values():
        if participant.metadata:
            try:
                config = json.loads(participant.metadata)
                logger.info(f"📋 Found participant config: {config}")
                break
            except json.JSONDecodeError as e:
                logger.warning(f"Failed to parse participant metadata: {e}")
    
    # Fallback: Try room metadata if no participant metadata found
    if not config and ctx.room.metadata:
        try:
            config = json.loads(ctx.room.metadata)
            logger.info(f"📋 Using room metadata as fallback: {config}")
        except json.JSONDecodeError as e:
            logger.warning(f"Failed to parse room metadata: {e}")
    
    return config



async def entrypoint(ctx: JobContext):
    """Main entrypoint for the WingMan Social Skills Coach - Modular Multi-User Implementation"""
    
    await ctx.connect()
    logger.info("🚀 WingMan Agent Connected!")
    
    room_name = ctx.room.name
    logger.info(f"🏠 Room info: name='{room_name}', metadata='{ctx.room.metadata}'")
    
    # Register room with session manager for data communication
    await session_manager.register_room(room_name, ctx.room)
    
    # Parse room configuration
    config = await parse_room_config(ctx)
    
    # Extract scenario and difficulty with proper validation
    try:
        scenario_str = config.get("scenario", "Coffee Shop")
        scenario = ScenarioType(scenario_str)
    except ValueError:
        logger.warning(f"Invalid scenario '{scenario_str}', defaulting to Coffee Shop")
        scenario = ScenarioType.COFFEE_SHOP
    
    try:
        difficulty_str = config.get("difficulty", "Beginner")
        difficulty = DifficultyLevel(difficulty_str)
    except ValueError:
        logger.warning(f"Invalid difficulty '{difficulty_str}', defaulting to Beginner")
        difficulty = DifficultyLevel.BEGINNER
    
    user_id = config.get("user_id", "demo_user")
    logger.info(f"Starting WingMan practice session for user {user_id}: {scenario.value} - {difficulty.value}")
    
    # Create room configuration
    interview_context = config if scenario == ScenarioType.JOB_INTERVIEW else None
    room_config = room_config_manager.create_room_config(
        scenario=scenario,
        difficulty=difficulty,
        user_id=user_id,
        room_name=room_name,
        interview_context=interview_context
    )
    
    # Initialize session data with isolated state
    session = await session_manager.create_session(room_config)
    
    # Check for Google Cloud credentials
    credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_file or not os.path.exists(credentials_file):
        logger.error("❌ GOOGLE_APPLICATION_CREDENTIALS not found or invalid")
        logger.error("Please set GOOGLE_APPLICATION_CREDENTIALS to point to your service account JSON file")
        await session_manager.cleanup_session(room_name)
        return
    
    logger.info(f"✅ Using Google Cloud credentials: {credentials_file}")
    
    try:
        # Initialize AI components using the LiveKit pattern from docs
        logger.info("🔧 Initializing AI components...")
        
        # Create the modular WingMan agent with room-specific configuration
        agent = WingManAgent(room_config)
        
        # Set room context for tools
        from tools.social_tools import set_current_room
        set_current_room(room_name)
        
        # Get persona-specific voice model
        voice_model = agent.get_voice_model()
        logger.info(f"🎤 Using ELEVENLABS voice model: {voice_model} for persona {room_config.persona_name}")
        
        # Initialize AI session with persona-specific voice
        # Check required API keys
        google_api_key = os.getenv("GOOGLE_API_KEY")
        elevenlabs_api_key = os.getenv("ELEVENLABS_API_KEY")
        
        if not google_api_key:
            logger.error("❌ GOOGLE_API_KEY not found in environment")
            await session_manager.cleanup_session(room_name)
            return
            
        if not elevenlabs_api_key:
            logger.error("❌ DEEPGRAM_API_KEY not found in environment")
            await session_manager.cleanup_session(room_name)
            return
            
        logger.info(f"✅ API keys validated - Google: {google_api_key[:10]}..., Elevenlabs: {elevenlabs_api_key[:10]}...")
        
        agent_session = AgentSession(
            stt=google.STT(credentials_file=credentials_file),
            llm=google.LLM(api_key=google_api_key, model="gemini-2.0-flash-lite-001"),
            tts=elevenlabs.TTS(api_key=elevenlabs_api_key, voice_id=voice_model),
            vad=silero.VAD.load(),  # Voice Activity Detection as shown in docs
        )
        
        logger.info("✅ All AI components initialized successfully!")
        logger.info("🎯 Starting agent session...")
        
        # Debug room participants
        logger.info(f"📊 Room participants: {len(ctx.room.remote_participants)} remote, local: {ctx.room.local_participant}")
        
        # Start the session following the LiveKit pattern
        await agent_session.start(
            room=ctx.room,
            agent=agent,
        )
        
        logger.info("🔄 Agent session started, waiting for participants...")
        
        # Wait a bit for the session to fully initialize
        await asyncio.sleep(2)
        
        # Get personalized welcome message from the agent's persona
        welcome_msg = agent.get_welcome_message()
        logger.info(f"💬 Generating welcome: {welcome_msg}")
        
        # Generate initial greeting using the LiveKit pattern
        await agent_session.generate_reply(
            instructions=f"""Start by saying exactly: '{welcome_msg}' 
            Then IMMEDIATELY use suggest_conversation_starter to provide UI options.
            
            CRITICAL REMINDERS:
            - Tool outputs go to UI only - NEVER speak their content
            - Keep your spoken response natural and conversational
            - Don't mention feedback, scores, or tips aloud
            - Stay in character as {room_config.persona_name}"""
        )
        
        logger.info("🎉 WingMan Agent is ready for conversation!")
        logger.info("🎤 Listening for voice input...")
        logger.info("🔊 TTS ready for responses...")
        
    except Exception as e:
        logger.error(f"❌ Error initializing agent for room {room_name}: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        
        # Clean up session on error
        await session_manager.cleanup_session(room_name)
        room_config_manager.remove_room_config(room_name)
        raise

    finally:
        # Register cleanup handler for when the session ends
        def cleanup_handler():
            try:
                asyncio.create_task(session_manager.cleanup_session(room_name))
                room_config_manager.remove_room_config(room_name)
                logger.info(f"✅ Cleaned up session for room {room_name}")
            except Exception as cleanup_error:
                logger.warning(f"Error during cleanup for room {room_name}: {cleanup_error}")
        
        # Note: In a real implementation, you'd want to register this cleanup handler
        # with the LiveKit room's disconnect event

if __name__ == "__main__":
    try:
        # Use the exact pattern from LiveKit documentation
        agents.cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
    except KeyboardInterrupt:
        logger.info("👋 Application interrupted by user")
        # Log active sessions info
        active_count = session_manager.get_active_sessions_count()
        active_rooms = session_manager.get_active_rooms()
        logger.info(f"Active sessions at shutdown: {active_count}")
        logger.info(f"Active rooms: {active_rooms}")
    except Exception as e:
        logger.error(f"💥 Application error: {e}")
        raise