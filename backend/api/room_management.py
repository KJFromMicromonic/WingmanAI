#!/usr/bin/env python3
"""
API utilities for room management and configuration
"""

import json
import logging
from typing import Dict, Optional, List
from core.types import ScenarioType, DifficultyLevel, RoomConfig
from core.persona_registry import PersonaRegistry
from core.room_config import room_config_manager
from core.session_manager import session_manager

logger = logging.getLogger(__name__)

class RoomManagementAPI:
    """API utilities for managing WingMan agent rooms"""
    
    @staticmethod
    def create_room_metadata(
        scenario: str,
        difficulty: str,
        user_id: str
    ) -> Dict:
        """Create room metadata for LiveKit room creation"""
        try:
            scenario_enum = ScenarioType(scenario)
            difficulty_enum = DifficultyLevel(difficulty)
        except ValueError as e:
            logger.error(f"Invalid scenario or difficulty: {e}")
            raise ValueError(f"Invalid parameters: {e}")
        
        # Get persona info
        persona = PersonaRegistry.get_persona(scenario_enum)
        
        metadata = {
            "scenario": scenario,
            "difficulty": difficulty,
            "user_id": user_id,
            "persona_name": persona.config.name,
            "voice_model": persona.config.voice_model,
            "agent_type": "wingman-social-coach"
        }
        
        return metadata
    
    @staticmethod
    def get_available_scenarios() -> List[Dict]:
        """Get list of available scenarios with persona info"""
        scenarios = []
        
        for scenario in PersonaRegistry.get_available_scenarios():
            persona_info = PersonaRegistry.get_persona_info(scenario)
            scenarios.append({
                "scenario": scenario.value,
                "persona": persona_info,
                "voice_model": persona_info.get("voice_model"),
                "description": f"Practice social skills with {persona_info.get('name')} in a {scenario.value.lower()} setting"
            })
        
        return scenarios
    
    @staticmethod
    def get_room_config_for_frontend(room_name: str) -> Optional[Dict]:
        """Get room configuration formatted for frontend consumption"""
        config = room_config_manager.get_room_config(room_name)
        if not config:
            return None
        
        return {
            "room_name": config.room_name,
            "scenario": config.scenario.value,
            "difficulty": config.difficulty.value,
            "persona_name": config.persona_name,
            "voice_model": config.voice_model,
            "user_id": config.user_id,
            "max_participants": config.max_participants,
            "timeout_minutes": config.timeout_minutes
        }
    
    @staticmethod
    async def get_session_status(room_name: str) -> Dict:
        """Get current session status for a room"""
        session = await session_manager.get_session(room_name)
        if not session:
            return {"status": "not_found", "message": "No active session"}
        
        summary = await session_manager.get_session_summary(room_name)
        summary["status"] = "active"
        return summary
    
    @staticmethod
    def get_voice_config_mapping() -> Dict[str, str]:
        """Get mapping of scenarios to Deepgram voice models"""
        mapping = {}
        
        for scenario in PersonaRegistry.get_available_scenarios():
            persona = PersonaRegistry.get_persona(scenario)
            mapping[scenario.value] = persona.config.voice_model
        
        return mapping
    
    @staticmethod
    async def cleanup_user_sessions(user_id: str) -> int:
        """Clean up all sessions for a specific user"""
        active_rooms = room_config_manager.get_rooms_for_user(user_id)
        cleanup_count = 0
        
        for room_name in active_rooms.keys():
            try:
                await session_manager.cleanup_session(room_name)
                room_config_manager.remove_room_config(room_name)
                cleanup_count += 1
                logger.info(f"Cleaned up session for user {user_id} in room {room_name}")
            except Exception as e:
                logger.warning(f"Error cleaning up room {room_name} for user {user_id}: {e}")
        
        return cleanup_count

# Global API instance for easy access
room_api = RoomManagementAPI()
