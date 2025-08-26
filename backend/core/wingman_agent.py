#!/usr/bin/env python3
"""
Modular WingMan Agent class
"""

import logging
from livekit.agents import Agent
from core.types import ScenarioType, RoomConfig
from core.persona_registry import PersonaRegistry
from tools.social_tools import (
    provide_conversation_feedback,
    suggest_conversation_starter,
    share_social_tip
)
from tools.interview_tools import (
    ask_interview_question,
    provide_interview_feedback
)

logger = logging.getLogger(__name__)

class WingManAgent(Agent):
    """WingMan Agent for both Social Coaching and Interview Practice"""
    
    def __init__(self, room_config: RoomConfig):
        self.room_config = room_config
        self.persona = PersonaRegistry.get_persona(room_config.scenario, room_config)
        
        instructions = self.persona.get_instructions(room_config.difficulty)
        
        if room_config.scenario == ScenarioType.JOB_INTERVIEW:
            tools = [
                ask_interview_question,
                provide_interview_feedback
            ]
            if room_config.interview_context:
                jd = room_config.interview_context.get('job_description', 'N/A')
                resume = room_config.interview_context.get('candidate_resume', 'N/A')
                instructions += f'''

ADDITIONAL INTERVIEW CONTEXT:
- Job Description: {jd}
- Candidate Resume: {resume}

Your primary goal is to conduct a realistic interview based on these documents.
'''
        else:
            tools = [
                provide_conversation_feedback,
                suggest_conversation_starter,
                share_social_tip
            ]
        
        super().__init__(
            instructions=instructions,
            tools=tools
        )
        
        self._room_name = room_config.room_name
        
        logger.info(f"Created WingMan agent for room {room_config.room_name} with persona {self.persona.config.name}")
    
    def get_room_name(self) -> str:
        """Get the room name for this agent instance"""
        return self._room_name
    
    def get_welcome_message(self) -> str:
        """Get the appropriate welcome message for this persona and difficulty"""
        welcome_messages = self.persona.get_welcome_messages()
        return welcome_messages.get(
            self.room_config.difficulty,
            f"Hi! I'm {self.persona.config.name}. Let's practice some social skills together!"
        )
    
    def get_voice_model(self) -> str:
        """Get the Deepgram voice model for this persona"""
        return self.persona.config.voice_model
