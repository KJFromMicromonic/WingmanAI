#!/usr/bin/env python3
"""
Social skills tools for WingMan AI - Modular and multi-user safe
"""

import logging
from datetime import datetime
from typing import List, Optional
from livekit.agents import function_tool
from core.session_manager import session_manager

logger = logging.getLogger(__name__)

# Simple global context for current room (will be set by agent session)
_current_room_context: Optional[str] = None

def set_current_room(room_name: str):
    """Set the current room for tool context"""
    global _current_room_context
    _current_room_context = room_name

def get_current_room() -> Optional[str]:
    """Get the current room name"""
    return _current_room_context

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
    
    # Get current room context
    room_name = get_current_room()
    
    # Update session data if room is available
    if room_name:
        session = await session_manager.get_session(room_name)
        if session:
            session.feedback_given.append(feedback_entry)
            session.confidence_scores.append(float(confidence_level))
            session.conversation_turns += 1
            
            if social_skill_focus and social_skill_focus not in session.social_skills_practiced:
                session.social_skills_practiced.append(social_skill_focus)
            
            await session_manager.update_session(room_name, session)
    
    logger.info(f"Conversation feedback for {room_name}: Quality {conversation_quality}/10, Confidence {confidence_level}/10 - {social_skill_focus}")
    
    result = {
        "status": "feedback_recorded",
        "feedback": feedback_entry,
        "message": specific_feedback,
        "rating": rating,
        "suggestions": improvement_tips.split('\n') if improvement_tips else [],
        "ui_only": True,  # Signal that this is for UI display only
        "do_not_speak": True  # Explicit instruction not to verbalize
    }
    
    # Send to frontend via LiveKit data channel
    if room_name:
        await session_manager.send_data_to_room(room_name, result)
    
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
    # Get current room context
    room_name = get_current_room()
    
    # Update session data if room is available
    if room_name:
        session = await session_manager.get_session(room_name)
        if session and context not in session.topics_discussed:
            session.topics_discussed.append(context)
            await session_manager.update_session(room_name, session)
    
    logger.info(f"Conversation starters suggested for {room_name}: {context}")
    
    result = {
        "status": "starters_suggested",
        "context": context,
        "starters": conversation_starters,
        "level": difficulty_level,
        "timestamp": datetime.now().isoformat(),
        "ui_only": True,  # Signal that this is for UI display only
        "do_not_speak": True  # Explicit instruction not to verbalize
    }
    
    # Send to frontend via LiveKit data channel
    if room_name:
        await session_manager.send_data_to_room(room_name, result)
    
    return result

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
    # Get current room context
    room_name = get_current_room()
    
    # Update session data if room is available
    if room_name:
        session = await session_manager.get_session(room_name)
        if session and category not in session.topics_discussed:
            session.topics_discussed.append(category)
            await session_manager.update_session(room_name, session)
    
    logger.info(f"Social tip shared for {room_name}: {category}")
    
    result = {
        "status": "tip_shared",
        "tip": tip,
        "category": category,
        "examples": real_world_examples or [],
        "timestamp": datetime.now().isoformat(),
        "ui_only": True,  # Signal that this is for UI display only
        "do_not_speak": True  # Explicit instruction not to verbalize
    }
    
    # Send to frontend via LiveKit data channel
    if room_name:
        await session_manager.send_data_to_room(room_name, result)
    
    return result
