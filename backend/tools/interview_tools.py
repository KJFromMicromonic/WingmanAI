'''
Tools for conducting job interviews.
'''

import logging
from datetime import datetime
from typing import List, Optional
from livekit.agents import function_tool
from core.session_manager import session_manager

logger = logging.getLogger(__name__)

@function_tool
async def ask_interview_question(
    question: str,
    question_type: str, # e.g., 'behavioral', 'technical', 'situational'
    related_to: str # e.g., 'resume', 'job_description', 'previous_answer'
):
    '''
    Asks the candidate an interview question.
    
    Args:
        question: The question to ask the candidate.
        question_type: The type of question being asked.
        related_to: What the question is based on.
    '''
    room_name = session_manager.get_active_rooms()[0] # Simplified for single-room context in this tool
    data = {
        'type': 'question',
        'question': question,
        'question_type': question_type,
        'related_to': related_to,
        'timestamp': datetime.now().isoformat(),
        'ui_only': True,
        'do_not_speak': True
    }
    await session_manager.send_data_to_room(room_name, data)
    logger.info(f"Asked {question_type} question for room {room_name}")
    return {"status": "question_asked", "question": question}

@function_tool
async def provide_interview_feedback(
    answer_quality: float,
    clarity_score: float,
    relevance_score: float,
    feedback: str,
    improvement_tips: str,
    evaluation_criteria: str # e.g., 'STAR method', 'technical accuracy', 'problem-solving'
):
    '''
    Provides feedback on the candidate's answer.
    
    Args:
        answer_quality: Overall score for the answer (1-10).
        clarity_score: Score for clarity (1-10).
        relevance_score: Score for relevance (1-10).
        feedback: Specific feedback on the answer.
        improvement_tips: Tips for improving the answer.
        evaluation_criteria: The criteria used for evaluation.
    '''
    room_name = session_manager.get_active_rooms()[0]
    data = {
        'type': 'feedback',
        'answer_quality': answer_quality,
        'clarity_score': clarity_score,
        'relevance_score': relevance_score,
        'feedback': feedback,
        'tips': improvement_tips,
        'criteria': evaluation_criteria,
        'timestamp': datetime.now().isoformat(),
        'ui_only': True,
        'do_not_speak': True
    }
    await session_manager.send_data_to_room(room_name, data)
    logger.info(f"Provided interview feedback for room {room_name}")
    return {"status": "feedback_provided"}
