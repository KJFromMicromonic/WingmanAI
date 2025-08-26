#!/usr/bin/env python3
"""
Room configuration system for different personas and scenarios
"""

import uuid
from typing import Dict, Optional
from core.types import RoomConfig, ScenarioType, DifficultyLevel
from core.persona_registry import PersonaRegistry

class RoomConfigManager:
    """Manages room configurations for different personas and scenarios"""
    
    def __init__(self):
        self._active_configs: Dict[str, RoomConfig] = {}
    
    def create_room_config(
        self,
        scenario: ScenarioType,
        difficulty: DifficultyLevel,
        user_id: str,
        room_name: Optional[str] = None,
        interview_context: Optional[Dict] = None
    ) -> RoomConfig:
        """Create a new room configuration"""
        
        if room_name is None:
            room_name = f"wingman-{scenario.value.lower().replace(' ', '-')}-{str(uuid.uuid4())[:8]}"
        
        persona_name = ""
        voice_model = ""

        if scenario == ScenarioType.JOB_INTERVIEW and interview_context:
            persona_name = interview_context.get("persona_name", "Interviewer")
            voice_model = interview_context.get("persona_voice", "aura-2-luna-en") # Default voice
        else:
            # Get persona info for standard scenarios
            persona = PersonaRegistry.get_persona(scenario)
            persona_name = persona.config.name
            voice_model = persona.config.voice_model

        config = RoomConfig(
            room_name=room_name,
            scenario=scenario,
            difficulty=difficulty,
            persona_name=persona_name,
            voice_model=voice_model,
            user_id=user_id,
            interview_context=interview_context
        )
        
        self._active_configs[room_name] = config
        return config
    
    def get_room_config(self, room_name: str) -> Optional[RoomConfig]:
        """Get room configuration by room name"""
        return self._active_configs.get(room_name)
    
    def remove_room_config(self, room_name: str):
        """Remove room configuration when session ends"""
        if room_name in self._active_configs:
            del self._active_configs[room_name]
    
    def get_active_rooms(self) -> Dict[str, RoomConfig]:
        """Get all active room configurations"""
        return self._active_configs.copy()
    
    def get_rooms_for_user(self, user_id: str) -> Dict[str, RoomConfig]:
        """Get all active rooms for a specific user"""
        return {
            room_name: config 
            for room_name, config in self._active_configs.items() 
            if config.user_id == user_id
        }

# Global room config manager
room_config_manager = RoomConfigManager()
