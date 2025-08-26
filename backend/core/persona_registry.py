#!/usr/bin/env python3
"""
Persona registry for managing different persona configurations
"""

from typing import Dict, Type, Optional
from core.types import ScenarioType, RoomConfig, PersonaConfig
from personas.base import BasePersona
from personas.emma import EmmaPersona
from personas.alex import AlexPersona
from personas.maya import MayaPersona
from personas.jordan import JordanPersona
from personas.sam import SamPersona
from personas.dr_chen import DrChenPersona

# Import individual interviewer personas
from personas.sarahmitchell import DrSarahMitchellPersona
from personas.marcusinterviewer import MarcusJohnsonPersona  
from personas.jessicachen import JessicaChenPersona
from personas.roberthamilton import RobertHamiltonPersona
from personas.panelinterviewer import PanelInterviewPersona

class PersonaRegistry:
    """Central registry for all available personas"""
    
    _personas: Dict[ScenarioType, Type[BasePersona]] = {
        ScenarioType.COFFEE_SHOP: EmmaPersona,
        ScenarioType.GYM: AlexPersona,
        ScenarioType.BOOKSTORE: MayaPersona,
        ScenarioType.BAR_SOCIAL: JordanPersona,
        ScenarioType.PARK_WALK: SamPersona,
        ScenarioType.MUSEUM: DrChenPersona,
    }
    
    # Map interviewer persona names to their classes (matching your hardcoded files)
    _interviewer_personas: Dict[str, Type[BasePersona]] = {
        "Dr. Sarah Mitchell": DrSarahMitchellPersona,
        "Marcus Johnson": MarcusJohnsonPersona,
        "Jessica Chen": JessicaChenPersona,
        "Robert Hamilton": RobertHamiltonPersona,
        "Panel Interview": PanelInterviewPersona,
    }
    
    @classmethod
    def get_persona(cls, scenario: ScenarioType, room_config: Optional[RoomConfig] = None) -> BasePersona:
        """Get a persona instance for the given scenario"""
        
        if scenario == ScenarioType.JOB_INTERVIEW:
            if not room_config or not room_config.interview_context:
                # Default to Marcus Johnson if no room config
                return cls._interviewer_personas["Marcus Johnson"]()
            
            ctx = room_config.interview_context
            persona_name = ctx.get("persona_name", "Marcus Johnson")
            
            # Get the specific interviewer persona class
            if persona_name in cls._interviewer_personas:
                persona_class = cls._interviewer_personas[persona_name]
                
                # Check if we need to override default config with room-specific settings
                if any(key in ctx for key in ["persona_title", "persona_company", "persona_personality", "persona_style"]):
                    # Create a temporary instance to get default config
                    default_persona = persona_class()
                    
                    # Create custom PersonaConfig with overrides
                    persona_config = PersonaConfig(
                        name=ctx.get("persona_name", default_persona.config.name),
                        age=default_persona.config.age,
                        occupation=ctx.get("persona_title", default_persona.config.occupation),
                        personality=ctx.get("persona_personality", default_persona.config.personality),
                        interests=ctx.get("persona_interests", default_persona.config.interests),
                        backstory=f"An experienced {ctx.get('persona_title', default_persona.config.occupation)} at {ctx.get('persona_company', 'the company')} conducting an interview for a role. {default_persona.config.backstory}",
                        voice_model=ctx.get("persona_voice", default_persona.config.voice_model),
                        scenario_context=f"Conduct a job interview for the role described in the job description. The candidate's resume is also provided. Your persona style is {ctx.get('persona_style', 'professional')} and your personality is {ctx.get('persona_personality', default_persona.config.personality)} and you are from {ctx.get('persona_company', 'the company')}. {default_persona.config.scenario_context}"
                    )
                    return persona_class(persona_config)
                else:
                    # Use default configuration
                    return persona_class()
            else:
                # Fallback to Marcus Johnson if persona not found
                return cls._interviewer_personas["Marcus Johnson"]()
        
        # Handle non-interview scenarios
        if scenario not in cls._personas:
            raise ValueError(f"No persona registered for scenario: {scenario}")
        
        persona_class = cls._personas[scenario]
        return persona_class()
    
    @classmethod
    def get_available_scenarios(cls) -> list[ScenarioType]:
        """Get list of all available scenarios"""
        return list(cls._personas.keys()) + [ScenarioType.JOB_INTERVIEW]
    
    @classmethod
    def get_available_interview_personas(cls) -> list[str]:
        """Get list of all available interviewer personas"""
        return list(cls._interviewer_personas.keys())
    
    @classmethod
    def get_persona_info(cls, scenario: ScenarioType, persona_name: Optional[str] = None) -> Dict:
        """Get basic info about a persona without instantiating it"""
        
        if scenario == ScenarioType.JOB_INTERVIEW:
            if persona_name and persona_name in cls._interviewer_personas:
                persona = cls._interviewer_personas[persona_name]()
                return {
                    "name": persona.config.name,
                    "age": persona.config.age,
                    "occupation": persona.config.occupation,
                    "personality": persona.config.personality,
                    "interests": persona.config.interests,
                    "voice_model": persona.config.voice_model,
                    "scenario": scenario.value,
                    "backstory": persona.config.backstory
                }
            else:
                return {
                    "name": "Interview Persona",
                    "age": 35,
                    "occupation": "Varies based on selection",
                    "personality": "Dynamic and context-aware",
                    "interests": ["Conducting interviews"],
                    "voice_model": "Varies",
                    "scenario": scenario.value,
                    "available_personas": cls.get_available_interview_personas()
                }
        
        if scenario not in cls._personas:
            return {}
        
        persona = cls.get_persona(scenario)
        return {
            "name": persona.config.name,
            "age": persona.config.age,
            "occupation": persona.config.occupation,
            "personality": persona.config.personality,
            "interests": persona.config.interests,
            "voice_model": persona.config.voice_model,
            "scenario": scenario.value,
            "backstory": getattr(persona.config, 'backstory', '')
        }
    
    @classmethod
    def get_interview_persona_info(cls, persona_name: str) -> Dict:
        """Get detailed info about a specific interviewer persona"""
        if persona_name not in cls._interviewer_personas:
            raise ValueError(f"Unknown interview persona: {persona_name}")
        
        persona = cls._interviewer_personas[persona_name]()
        return {
            "name": persona.config.name,
            "age": persona.config.age,
            "occupation": persona.config.occupation,
            "personality": persona.config.personality,
            "interests": persona.config.interests,
            "backstory": persona.config.backstory,
            "voice_model": persona.config.voice_model,
            "scenario_context": persona.config.scenario_context
        }