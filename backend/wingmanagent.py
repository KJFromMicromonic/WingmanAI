#!/usr/bin/env python3
"""
WingMan AI Voice Agent - Correct Implementation
Based on actual LiveKit Agents documentation
"""

import asyncio
import os
import json
import dotenv
import logging
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import uuid

from livekit import agents
from livekit.agents import (
    Agent, 
    AgentSession, 
    JobContext, 
    WorkerOptions, 
    RoomInputOptions,
    function_tool
)
from livekit import rtc
from livekit.plugins import google, silero, elevenlabs, deepgram

dotenv.load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ScenarioType(Enum):
    COFFEE_SHOP = "Coffee Shop"
    PARK_WALK = "Park Walk"
    BOOKSTORE = "Bookstore"
    BAR_SOCIAL = "Bar Social"
    GYM = "Gym"
    MUSEUM = "Museum"

class DifficultyLevel(Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

@dataclass
class PracticeSession:
    """Track user's social skills practice session"""
    session_id: str = field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str = "demo_user"
    scenario: ScenarioType = ScenarioType.COFFEE_SHOP
    difficulty: DifficultyLevel = DifficultyLevel.BEGINNER
    session_start: datetime = field(default_factory=datetime.now)
    conversation_turns: int = 0
    feedback_given: List[Dict] = field(default_factory=list)
    confidence_scores: List[float] = field(default_factory=list)
    topics_discussed: List[str] = field(default_factory=list)
    social_skills_practiced: List[str] = field(default_factory=list)

# Global session storage
practice_session: Optional[PracticeSession] = None
current_room: Optional[rtc.Room] = None

async def send_data_to_frontend(data: dict):
    """Send data to frontend via LiveKit data channel"""
    global current_room
    if current_room:
        try:
            # Encode data as JSON bytes
            data_bytes = json.dumps(data).encode('utf-8')
            # Send to all participants (frontend clients)
            await current_room.local_participant.publish_data(data_bytes)
            logger.debug(f"📤 Sent data to frontend: {data.get('status', 'unknown')}")
        except Exception as e:
            logger.warning(f"Failed to send data to frontend: {e}")

@function_tool
async def provide_conversation_feedback(
    user_message: str,
    conversation_quality: float,
    specific_feedback: str,
    improvement_tips: str = "",
    social_skill_focus: str = "",
    confidence_level: int = 5
):
    """
    Analyze conversation quality and provide social skills feedback (UNIFIED with confidence tracking)
    
    Args:
        user_message: The user's message being analyzed
        conversation_quality: Score from 1-10 for conversation quality
        specific_feedback: Detailed feedback on the conversation
        improvement_tips: Tips for improvement
        social_skill_focus: The social skill being practiced (e.g., "active listening", "asking questions")
        confidence_level: User's confidence level (1-10) - UNIFIED tracking
    """
    global practice_session
    
    # Validate score ranges
    conversation_quality = max(1.0, min(10.0, conversation_quality))
    confidence_level = max(1, min(10, confidence_level))
    
    # Determine rating for frontend
    rating = "good" if conversation_quality >= 7 else "improve" if conversation_quality >= 5 else "needs_work"
    
    feedback_entry = {
        "user_message": user_message,
        "quality_score": conversation_quality,
        "confidence_level": confidence_level,
        "feedback": specific_feedback,
        "tips": improvement_tips,
        "skill_focus": social_skill_focus,
        "rating": rating,
        "timestamp": datetime.now().isoformat()
    }
    
    if practice_session:
        practice_session.feedback_given.append(feedback_entry)
        practice_session.confidence_scores.append(float(confidence_level))
        practice_session.conversation_turns += 1
        
        if social_skill_focus and social_skill_focus not in practice_session.social_skills_practiced:
            practice_session.social_skills_practiced.append(social_skill_focus)
    
    logger.info(f"Conversation feedback: Quality {conversation_quality}/10, Confidence {confidence_level}/10 - {social_skill_focus}")
    
    result = {
        "status": "feedback_recorded",
        "feedback": feedback_entry,
        "message": specific_feedback,
        "rating": rating,
        "suggestions": improvement_tips.split('\n') if improvement_tips else []
    }
    
    # Send to frontend via LiveKit data channel
    await send_data_to_frontend(result)
    
    return result

@function_tool
async def suggest_conversation_starter(
    context: str,
    conversation_starters: List[str],
    difficulty_level: str = "beginner"
):
    """
    Suggest natural conversation starters for the current scenario
    
    Args:
        context: The current context or situation
        conversation_starters: List of suggested conversation starters
        difficulty_level: Difficulty level of the suggestions
    """
    global practice_session
    
    if practice_session:
        if context not in practice_session.topics_discussed:
            practice_session.topics_discussed.append(context)
    
    logger.info(f"Conversation starters suggested for: {context}")
    
    result = {
        "status": "starters_suggested",
        "context": context,
        "starters": conversation_starters,
        "level": difficulty_level,
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to frontend via LiveKit data channel
    await send_data_to_frontend(result)
    
    return result

# REMOVED: track_confidence_progress - UNIFIED with provide_conversation_feedback

@function_tool
async def share_social_tip(
    tip: str,
    category: str,
    real_world_examples: List[str] = None
):
    """
    Share social skills tips and real-world applications
    
    Args:
        tip: The social skills tip or advice
        category: Category of tip (e.g., "body language", "conversation flow", "emotional intelligence")
        real_world_examples: Examples of how to apply the tip
    """
    global practice_session
    
    if practice_session and category not in practice_session.topics_discussed:
        practice_session.topics_discussed.append(category)
    
    logger.info(f"Social tip shared: {category}")
    
    result = {
        "status": "tip_shared",
        "tip": tip,
        "category": category,
        "examples": real_world_examples or [],
        "timestamp": datetime.now().isoformat()
    }
    
    # Send to frontend via LiveKit data channel
    await send_data_to_frontend(result)
    
    return result

def get_persona_instructions(scenario: ScenarioType, difficulty: DifficultyLevel) -> str:
    """Generate persona instructions based on scenario and difficulty"""
    
    personas = {
        ScenarioType.COFFEE_SHOP: {
            "name": "Emma",
            "age": 24,
            "occupation": "Graduate student in Literature",
            "personality": "Friendly, intellectual, slightly shy but warming up",
            "interests": ["reading", "coffee", "creative writing", "indie films"],
            "backstory": "Just moved to the city for grad school, loves discovering new coffee shops"
        },
        ScenarioType.GYM: {
            "name": "Alex",
            "age": 28,
            "occupation": "Personal trainer and fitness enthusiast",
            "personality": "Energetic, motivational, health-conscious, approachable",
            "interests": ["fitness", "nutrition", "outdoor activities", "sports"],
            "backstory": "Works at this gym, always willing to help newcomers with their fitness journey"
        },
        ScenarioType.BOOKSTORE: {
            "name": "Maya",
            "age": 26,
            "occupation": "Independent bookstore manager and aspiring writer",
            "personality": "Creative, thoughtful, passionate about literature",
            "interests": ["books", "poetry", "local authors", "book clubs"],
            "backstory": "Runs a small independent bookstore, loves recommending books to customers"
        },
        ScenarioType.BAR_SOCIAL: {
            "name": "Jordan",
            "age": 30,
            "occupation": "Marketing professional",
            "personality": "Outgoing, witty, social, enjoys meeting new people",
            "interests": ["craft cocktails", "networking", "live music", "travel"],
            "backstory": "Out for drinks after work, enjoys socializing and meeting new people"
        },
        ScenarioType.PARK_WALK: {
            "name": "Sam",
            "age": 25,
            "occupation": "Environmental scientist",
            "personality": "Nature-loving, calm, thoughtful, environmentally conscious",
            "interests": ["hiking", "photography", "environmental causes", "mindfulness"],
            "backstory": "Regular park visitor who enjoys walks and connecting with nature and people"
        },
        ScenarioType.MUSEUM: {
            "name": "Dr. Chen",
            "age": 32,
            "occupation": "Art history professor",
            "personality": "Knowledgeable, passionate about art, patient educator",
            "interests": ["art history", "museums", "cultural events", "teaching"],
            "backstory": "Art professor who frequently visits museums and enjoys discussing art with others"
        }
    }
    
    persona = personas.get(scenario, personas[ScenarioType.COFFEE_SHOP])
    
    base_instruction = f"""
You are {persona['name']}, a {persona['age']}-year-old {persona['occupation']}. 

PERSONALITY: {persona['personality']}
INTERESTS: {', '.join(persona['interests'])}
BACKSTORY: {persona['backstory']}

SCENARIO SETTING: {scenario.value}
DIFFICULTY LEVEL: {difficulty.value}

CORE RESPONSIBILITIES:
1. Stay completely in character as {persona['name']}
2. Help users practice social skills through natural conversation
3. **MANDATORY TOOL USAGE - Follow this exact pattern:**

TOOL USAGE RULES (CRITICAL):
1. **IMMEDIATELY after your greeting**: Use suggest_conversation_starter ONCE ONLY
2. **Every 3rd user message**: Use provide_conversation_feedback (includes confidence tracking)
3. **When confidence < 5/10 OR conversation stalls**: Use share_social_tip
4. **IMPORTANT**: These tools output JSON for frontend display - do NOT speak their results aloud

CONVERSATION APPROACH:
- Be authentic to your character while being helpful for practice
- Respond naturally as {persona['name']} would in this {scenario.value} setting
- Create realistic social interactions that help build confidence
- **ALWAYS follow the tool usage pattern above**
- Encourage the user and celebrate their progress

MESSAGE COUNTING PATTERN:
- User Message 1: Regular Emma response
- User Message 2: Regular Emma response  
- User Message 3: Regular Emma response + provide_conversation_feedback
- User Message 4: Regular Emma response
- User Message 5: Regular Emma response
- User Message 6: Regular Emma response + provide_conversation_feedback
- Repeat cycle...

FEEDBACK STYLE:
- Be encouraging and supportive, never critical
- Focus on specific, actionable improvements
- Recognize what the user did well before suggesting improvements
- Provide practical tips that can be used in real-life situations
- Track different types of social skills (conversation starters, active listening, etc.)

SCENARIO-SPECIFIC BEHAVIOR:
{get_scenario_context(scenario)}

Remember: This is practice for real-world social interactions. Be realistic but supportive!
"""
    
    difficulty_guidance = {
        DifficultyLevel.BEGINNER: """
BEGINNER GUIDANCE:
- Be extra patient and encouraging
- Focus on basic conversation skills (greetings, introductions, simple questions)
- Provide lots of positive reinforcement
- Give simple, actionable tips
- Don't overwhelm with too much feedback at once
        """,
        DifficultyLevel.INTERMEDIATE: """
INTERMEDIATE GUIDANCE:
- Challenge with more complex conversations
- Focus on conversation flow and deeper topics
- Provide feedback on emotional intelligence and reading social cues
- Encourage storytelling and sharing personal experiences
        """,
        DifficultyLevel.ADVANCED: """
ADVANCED GUIDANCE:
- Engage in sophisticated social interactions
- Focus on nuanced social skills like humor, persuasion, networking
- Provide subtle feedback on charisma and social presence
- Practice difficult social situations and conflict resolution
        """
    }
    
    return base_instruction + difficulty_guidance.get(difficulty, "")

def get_scenario_context(scenario: ScenarioType) -> str:
    """Get specific context for each scenario"""
    contexts = {
        ScenarioType.COFFEE_SHOP: "You're both waiting in line at a cozy coffee shop. You have a book in your hand and seem approachable.",
        ScenarioType.GYM: "You're at the gym between sets, open to helping others and discussing fitness topics.",
        ScenarioType.BOOKSTORE: "You're browsing the bookstore, passionate about books and happy to make recommendations.",
        ScenarioType.BAR_SOCIAL: "You're at a trendy bar after work, enjoying a drink and open to social conversation.",
        ScenarioType.PARK_WALK: "You're taking a peaceful walk in the park, enjoying nature and open to friendly conversation.",
        ScenarioType.MUSEUM: "You're viewing art at a museum, knowledgeable about the exhibits and willing to share insights."
    }
    return contexts.get(scenario, "You're in a social setting, open to conversation.")

class WingManAgent(Agent):
    """WingMan Social Skills Coach Agent - Based on LiveKit patterns"""
    
    def __init__(self, scenario: ScenarioType, difficulty: DifficultyLevel):
        self.scenario = scenario
        self.difficulty = difficulty
        
        # Create instructions and tools following LiveKit Agent pattern
        instructions = get_persona_instructions(scenario, difficulty)
        
        super().__init__(
            instructions=instructions,
            tools=[
                provide_conversation_feedback,
                suggest_conversation_starter,
                share_social_tip
            ]
        )

async def entrypoint(ctx: JobContext):
    """Main entrypoint for the WingMan Social Skills Coach - Following LiveKit pattern"""
    
    await ctx.connect()
    logger.info("🚀 WingMan Agent Connected!")
    
    # Store room reference for data sending
    global current_room
    current_room = ctx.room
    
    # Debug room information
    logger.info(f"🏠 Room info: name='{ctx.room.name}', metadata='{ctx.room.metadata}'")
    
    # Get config from the first participant's metadata (the user who started the session)
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
    
    logger.info(f"Starting WingMan practice session: {scenario.value} - {difficulty.value}")
    
    # Initialize session data
    global practice_session
    practice_session = PracticeSession(
        user_id=config.get("user_id", "demo_user"),
        scenario=scenario,
        difficulty=difficulty
    )
    
    # Check for Google Cloud credentials
    credentials_file = os.getenv("GOOGLE_APPLICATION_CREDENTIALS")
    if not credentials_file or not os.path.exists(credentials_file):
        logger.error("❌ GOOGLE_APPLICATION_CREDENTIALS not found or invalid")
        logger.error("Please set GOOGLE_APPLICATION_CREDENTIALS to point to your service account JSON file")
        return
    
    logger.info(f"✅ Using Google Cloud credentials: {credentials_file}")
    
    try:
        # Initialize AI components using the LiveKit pattern from docs
        logger.info("🔧 Initializing AI components...")
        
        # Following the exact pattern from LiveKit docs
        session = AgentSession(
            stt=google.STT(credentials_file=credentials_file),
            llm=google.LLM(api_key=os.getenv("GOOGLE_API_KEY"), model="gemini-2.0-flash-lite"),
            tts=deepgram.TTS(api_key=os.getenv("DEEPGRAM_API_KEY"),model="aura-2-aurora-en"),
            vad=silero.VAD.load(),  # Voice Activity Detection as shown in docs
        )
        
        logger.info("✅ All AI components initialized successfully!")
        
        # Create the WingMan agent
        agent = WingManAgent(scenario=scenario, difficulty=difficulty)
        
        logger.info("🎯 Starting agent session...")
        
        # Start the session following the LiveKit pattern
        await session.start(
            room=ctx.room,
            agent=agent,
            room_input_options=RoomInputOptions(
                # Add any room-specific options here
            ),
        )
        
        # Generate personalized welcome message based on scenario and persona
        welcome_messages = {
            ScenarioType.COFFEE_SHOP: {
                DifficultyLevel.BEGINNER: "Hi there! I'm Emma. I couldn't help but notice you're here too - this place has such great coffee, doesn't it? What brings you here today?",
                DifficultyLevel.INTERMEDIATE: "Oh hi! I'm Emma. I love this coffee shop - it's so cozy. Are you a regular here too, or is this your first time?",
                DifficultyLevel.ADVANCED: "Good morning! I'm Emma. I was just thinking about how this coffee shop reminds me of the café from that novel I'm reading. Do you ever find places that feel like they're straight out of a book?"
            },
            ScenarioType.GYM: {
                DifficultyLevel.BEGINNER: "Hey! I'm Alex. I noticed you're here working out - that's awesome! How's your workout going today?",
                DifficultyLevel.INTERMEDIATE: "Hi there! I'm Alex, one of the trainers here. I've seen you around - you've been putting in great work! What are you focusing on today?",
                DifficultyLevel.ADVANCED: "Hey! Alex here. I noticed your form on those deadlifts - really solid technique. Have you been training long? Always great to see someone who takes their form seriously."
            },
            ScenarioType.BOOKSTORE: {
                DifficultyLevel.BEGINNER: "Hello! I'm Maya. Welcome to our bookstore! Are you looking for anything specific today?",
                DifficultyLevel.INTERMEDIATE: "Hi there! I'm Maya, I manage this little bookstore. I love helping people find their next great read. What kind of books do you usually enjoy?",
                DifficultyLevel.ADVANCED: "Good afternoon! I'm Maya. I couldn't help but notice you browsing our poetry section - are you a fan of contemporary poetry, or do you lean more toward the classics?"
            },
            ScenarioType.BAR_SOCIAL: {
                DifficultyLevel.BEGINNER: "Hey! I'm Jordan. Nice to meet you! How's your evening going?",
                DifficultyLevel.INTERMEDIATE: "Hi there! I'm Jordan. I don't think I've seen you here before - is this your first time at this place?",
                DifficultyLevel.ADVANCED: "Evening! I'm Jordan. I have to say, their craft cocktail menu here is impressive. Have you tried anything interesting yet?"
            },
            ScenarioType.PARK_WALK: {
                DifficultyLevel.BEGINNER: "Hi! I'm Sam. Beautiful day for a walk, isn't it? Do you come to this park often?",
                DifficultyLevel.INTERMEDIATE: "Hello! I'm Sam. I love walking here - this park has such peaceful energy. Are you enjoying the trails?",
                DifficultyLevel.ADVANCED: "Good afternoon! I'm Sam. I was just admiring how the light filters through these trees - perfect for photography. Are you here to enjoy nature too?"
            },
            ScenarioType.MUSEUM: {
                DifficultyLevel.BEGINNER: "Hello! I'm Dr. Chen. Are you enjoying the exhibit? This is one of my favorite museums.",
                DifficultyLevel.INTERMEDIATE: "Good afternoon! I'm Dr. Chen. I teach art history and love coming here. What's caught your attention so far?",
                DifficultyLevel.ADVANCED: "Greetings! I'm Dr. Chen. I was just contemplating the brushwork in this piece - the artist's technique is quite fascinating. What's your take on this particular work?"
            }
        }
        
        # Get appropriate welcome message
        welcome_msg = welcome_messages.get(scenario, {}).get(
            difficulty, 
            f"Hi! I'm excited to practice social skills with you in this {scenario.value.lower()} setting!"
        )
        
        # Generate initial greeting using the LiveKit pattern
        await session.generate_reply(
            instructions=f"Start the conversation by saying exactly: '{welcome_msg}' Then IMMEDIATELY use suggest_conversation_starter to provide initial conversation options. Be warm, stay in character, and follow the tool usage rules throughout the conversation."
        )
        
        logger.info("🎉 WingMan Agent is ready for conversation!")
        
    except Exception as e:
        logger.error(f"❌ Error initializing agent: {e}")
        logger.error(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        raise

def get_session_summary() -> Dict:
    """Generate comprehensive session summary"""
    global practice_session
    if not practice_session:
        return {"error": "No session data available"}
    
    session_duration = (datetime.now() - practice_session.session_start).total_seconds()
    avg_confidence = (
        sum(practice_session.confidence_scores) / len(practice_session.confidence_scores)
        if practice_session.confidence_scores else 0
    )
    
    performance_level = "Excellent" if avg_confidence >= 8 else \
                       "Good" if avg_confidence >= 6 else \
                       "Developing" if avg_confidence >= 4 else \
                       "Keep Practicing"
    
    return {
        "session_id": practice_session.session_id,
        "scenario": practice_session.scenario.value,
        "difficulty": practice_session.difficulty.value,
        "session_duration_minutes": round(session_duration / 60, 1),
        "conversation_turns": practice_session.conversation_turns,
        "feedback_entries": len(practice_session.feedback_given),
        "average_confidence": round(avg_confidence, 1),
        "performance_level": performance_level,
        "skills_practiced": practice_session.social_skills_practiced,
        "topics_discussed": practice_session.topics_discussed
    }

if __name__ == "__main__":
    try:
        # Use the exact pattern from LiveKit documentation
        agents.cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))
    except KeyboardInterrupt:
        logger.info("👋 Session interrupted by user")
        if practice_session:
            summary = get_session_summary()
            logger.info(f"Session summary: {summary}")
    except Exception as e:
        logger.error(f"💥 Application error: {e}")
        raise