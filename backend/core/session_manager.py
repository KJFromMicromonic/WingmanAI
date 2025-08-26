#!/usr/bin/env python3
"""
Multi-user session management for WingMan AI
"""

import asyncio
import json
import logging
from typing import Dict, Optional
from datetime import datetime
from core.types import PracticeSession, RoomConfig, ScenarioType, DifficultyLevel
from livekit import rtc

logger = logging.getLogger(__name__)

class SessionManager:
    """Manages multiple user sessions with isolated state"""
    
    def __init__(self):
        self._sessions: Dict[str, PracticeSession] = {}  # room_name -> session
        self._rooms: Dict[str, rtc.Room] = {}  # room_name -> room
        self._lock = asyncio.Lock()
    
    async def create_session(self, room_config: RoomConfig) -> PracticeSession:
        """Create a new practice session for a room"""
        async with self._lock:
            session = PracticeSession(
                user_id=room_config.user_id,
                scenario=room_config.scenario,
                difficulty=room_config.difficulty
            )
            
            self._sessions[room_config.room_name] = session
            logger.info(f"Created session {session.session_id} for room {room_config.room_name}")
            return session
    
    async def get_session(self, room_name: str) -> Optional[PracticeSession]:
        """Get session for a specific room"""
        return self._sessions.get(room_name)
    
    async def update_session(self, room_name: str, session: PracticeSession):
        """Update session data"""
        async with self._lock:
            self._sessions[room_name] = session
    
    async def register_room(self, room_name: str, room: rtc.Room):
        """Register a LiveKit room for data communication"""
        async with self._lock:
            self._rooms[room_name] = room
            logger.info(f"Registered room {room_name}")
    
    async def send_data_to_room(self, room_name: str, data: dict) -> bool:
        """Send data to a specific room"""
        room = self._rooms.get(room_name)
        if not room:
            logger.warning(f"Room {room_name} not found for data transmission")
            return False
        
        try:
            data_bytes = json.dumps(data).encode('utf-8')
            await room.local_participant.publish_data(data_bytes)
            logger.debug(f"📤 Sent data to room {room_name}: {data.get('status', 'unknown')}")
            return True
        except Exception as e:
            logger.warning(f"Failed to send data to room {room_name}: {e}")
            return False
    
    async def cleanup_session(self, room_name: str):
        """Clean up session when room is disconnected"""
        async with self._lock:
            if room_name in self._sessions:
                session = self._sessions[room_name]
                logger.info(f"Cleaning up session {session.session_id} for room {room_name}")
                del self._sessions[room_name]
            
            if room_name in self._rooms:
                del self._rooms[room_name]
    
    async def get_session_summary(self, room_name: str) -> Dict:
        """Generate session summary for a specific room"""
        session = await self.get_session(room_name)
        if not session:
            return {"error": "No session data available"}
        
        session_duration = (datetime.now() - session.session_start).total_seconds()
        avg_confidence = (
            sum(session.confidence_scores) / len(session.confidence_scores)
            if session.confidence_scores else 0
        )
        
        performance_level = "Excellent" if avg_confidence >= 8 else \
                           "Good" if avg_confidence >= 6 else \
                           "Developing" if avg_confidence >= 4 else \
                           "Keep Practicing"
        
        return {
            "session_id": session.session_id,
            "user_id": session.user_id,
            "scenario": session.scenario.value,
            "difficulty": session.difficulty.value,
            "session_duration_minutes": round(session_duration / 60, 1),
            "conversation_turns": session.conversation_turns,
            "feedback_entries": len(session.feedback_given),
            "average_confidence": round(avg_confidence, 1),
            "performance_level": performance_level,
            "skills_practiced": session.social_skills_practiced,
            "topics_discussed": session.topics_discussed
        }
    
    def get_active_sessions_count(self) -> int:
        """Get number of currently active sessions"""
        return len(self._sessions)
    
    def get_active_rooms(self) -> list[str]:
        """Get list of active room names"""
        return list(self._rooms.keys())

# Global session manager instance
session_manager = SessionManager()
