from datetime import datetime
from typing import List, Literal
from pydantic import BaseModel, Field
import json


class ThoughtContent(BaseModel):
    """Content payload of a Thought."""
    text: str = Field(..., description="A short or partial snippet of the thought.")
    full_text: str = Field(..., description="A more expanded full version if needed.")


class ThoughtConfig(BaseModel):
    """Configuration details about how this Thought should be handled."""
    modality: Literal["TEXT", "EMOJI", "VISUAL"] = Field(
        "TEXT", description="Modality of the thought content."
    )
    elaborationLevel: int = Field(
        1, description="Numeric handle (1-5) for how detailed the thought might be.", ge=1, le=5
    )
    abstractionLevel: int = Field(
        1, description="Numeric handle (1-5) for how abstract vs. concrete the thought is.", ge=1, le=5
    )
    interactivity: Literal["VIEW", "COMMENT", "EDIT"] = Field(
        "VIEW", description="Level of interactivity allowed for this thought."
    )
    persistent: bool = Field(
        False, description="Whether or not to anchor this Thought"
    )


class ThoughtTrigger(BaseModel):
    """User Event details that triggered this Thought."""
    event_id: str = Field(..., description="User Event ID")
    type: Literal["NEW_INPUT", "PAUSE", "INTERRUPT"] = Field(
        ..., description="Type of event that triggered this thought"
    )


class Thought(BaseModel):
    """Schema for a Thought in the thought-kit system."""
    id: str = Field(..., description="Required. Unique identifier for this Thought.")
    timestamp_created: datetime = Field(default_factory=datetime.now, description="Timestamp when thought was created")
    timestamp_updated: datetime = Field(default_factory=datetime.now, description="Timestamp when thought was last modified")
    
    content: ThoughtContent = Field(..., description="Required. Main payload of the Thought.")
    
    config: ThoughtConfig = Field(
        default_factory=ThoughtConfig, description="Configuration details about how this Thought should be handled."
    )
    
    trigger: ThoughtTrigger = Field(..., description="User Event details")
    
    parents: List[str] = Field(
        default_factory=list, description="Array of Thought IDs (the direct ancestors)."
    )
    references: List[str] = Field(
        default_factory=list, description="Array of external references (e.g. memory IDs)."
    )
    
    embedding: List[float] = Field(
        None, description="Array of floats for vector retrieval."
    )
    
    weight: float = Field(
        0.0, description="Numeric measure of importance or confidence (0-1 range).", ge=0.0, le=1.0
    )
    saliency: float = Field(
        0.0, description="Another measure of prominence/priority (0-1 range).", ge=0.0, le=1.0
    )
    
    user_comments: List[str] = Field(
        default_factory=list, description="Array of user-supplied strings (feedback, notes)."
    )

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "thought_123456",
                "timestamp_created": "2023-10-15T14:30:00",
                "timestamp_updated": "2023-10-15T14:30:00",
                "content": {
                    "text": "Climate data",
                    "full_text": "The user's question about 'global trends' suggests they may be seeking information related to climate change patterns."
                },
                "config": {
                    "modality": "TEXT",
                    "elaborationLevel": 2,
                    "abstractionLevel": 3,
                    "interactivity": "VIEW",
                    "persistent": False
                },
                "trigger": {
                    "event_id": "user_input_789",
                    "type": "NEW_INPUT"
                },
                "parents": [],
                "references": ["memory_climate_data_101"],
                "embedding": [0.1, 0.2, 0.3, 0.4],
                "weight": 0.75,
                "saliency": 0.6,
                "user_comments": []
            }
        }


# JSON Conversion Utilities

def thought_to_json(thought: Thought) -> str:
    """
    Convert a Thought object to a JSON string.
    
    Args:
        thought: The Thought object to convert
        
    Returns:
        A JSON string representation of the Thought
    """
    return thought.model_dump_json(indent=2)


def json_to_thought(json_str: str) -> Thought:
    """
    Convert a JSON string to a Thought object.
    
    Args:
        json_str: The JSON string to convert
        
    Returns:
        A Thought object
    """
    data = json.loads(json_str)
    return Thought.model_validate(data)


