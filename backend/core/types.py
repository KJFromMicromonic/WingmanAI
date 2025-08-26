#!/usr/bin/env python3
"""
Core types and enums for WingMan AI Voice Agent
"""

from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum
from datetime import datetime
import uuid

class ScenarioType(Enum):
    COFFEE_SHOP = "Coffee Shop"
    PARK_WALK = "Park Walk"
    BOOKSTORE = "Bookstore"
    BAR_SOCIAL = "Bar Social"
    GYM = "Gym"
    MUSEUM = "Museum"
    JOB_INTERVIEW = "Job Interview"

class DifficultyLevel(Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

@dataclass
class PersonaConfig:
    """Configuration for a specific persona"""
    name: str
    age: int
    occupation: str
    personality: str
    interests: List[str]
    backstory: str
    voice_model: str
    scenario_context: str

@dataclass
class PracticeSession:
    """Track user's social skills practice session - isolated per user"""
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

@dataclass
class RoomConfig:
    """Configuration for a LiveKit room"""
    room_name: str
    scenario: ScenarioType
    difficulty: DifficultyLevel
    persona_name: str
    voice_model: str
    user_id: str
    max_participants: int = 2
    timeout_minutes: int = 30
    interview_context: Optional[Dict] = None
