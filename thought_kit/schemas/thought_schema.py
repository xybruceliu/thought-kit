from typing import List, Literal, Union, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import json
import uuid
from datetime import datetime

from .common_schema import Timestamps, Content, Score, Prompt
from .event_schema import Event
from thought_kit.utils.llm_api import get_embedding


class ThoughtSeed(BaseModel):
    """Seed for generating a thought. This is used to generate a thought from a prompt. This is fixed after the thought is generated."""
    prompt: Prompt = Field(..., description="Prompt configuration for generating the thought")
    model: Literal["gpt-4o", "gpt-4o-mini"] = Field(..., description="Model to use for generating the thought")
    temperature: float = Field(..., description="Temperature for generation (0-1)", ge=0.0, le=1.0)
    type: str = Field(..., description="Self-defined type of thought to generate, provided by the user")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "prompt": {
                    "system_prompt": "You are an analytical assistant that provides factual information about climate change.",
                    "user_prompt": "What are the key data points about global warming trends?"
                },
                "model": "gpt-4o",
                "temperature": 0.7,
                "type": "interpretation"
            }
        }


class ThoughtConfig(BaseModel):
    """Configuration details about how this Thought should be handled. This can be updated after the thought is generated."""
    modality: Literal["TEXT", "EMOJI", "VISUAL"] = Field(
        "TEXT", description="Modality of the thought content."
    )
    depth: int = Field(
        1, description="Numeric handle (1-5) for how granular the thought is. 1 is the most abstract, 5 is the most concrete.", ge=1, le=5
    )
    length: int = Field(
        5, description="Maximum number of words the thought content should contain.", ge=1
    )
    interactivity: Literal["VIEW", "COMMENT", "EDIT"] = Field(
        "VIEW", description="Level of interactivity allowed for this thought."
    )
    persistent: bool = Field(
        False, description="Whether or not to anchor this Thought"
    )
    weight: float = Field(
        0.5, description="User-defined weight (0-1) for the thought", ge=0.0, le=1.0
    )

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "modality": "TEXT",
                "depth": 3,
                "length": 5,
                "interactivity": "VIEW",
                "persistent": False,
                "weight": 0.8
            }
        }


class Thought(BaseModel):
    """Schema for a Thought in the thought-kit system."""
    id: str = Field(..., description="Required. Unique identifier for this Thought.")
    timestamps: Timestamps = Field(default_factory=Timestamps, description="Timestamp information")
    
    content: Content = Field(..., description="Required. Main payload of the Thought.")
    
    config: ThoughtConfig = Field(
        default_factory=ThoughtConfig, description="Configuration details about how this Thought should be handled."
    )
    
    seed: Optional[ThoughtSeed] = Field(
        None, description="Seed used to generate this thought."
    )

    trigger_event: Event = Field(
        default_factory=Event, description="Event that triggered this thought."
    )
    
    references: List[str] = Field(
        default_factory=list, description="Array of references to the events and memories that may be relevant to this thought. Could happen after the thought is generated."
    )
    
    user_comments: List[str] = Field(
        default_factory=list, description="Array of user-supplied strings (emoji reactions, feedback, notes, etc.)"
    )

    score: Score = Field(
        default_factory=Score, description="Scoring metrics for the Thought."
    )
    

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "thought_123456",
                "timestamps": {
                    "created": "2023-10-15T14:30:00",
                    "updated": "2023-10-15T14:30:00"
                },
                "content": {
                    "text": "Climate change data",
                    "embedding": [0.1, 0.2, 0.3, 0.4]
                },
                "config": {
                    "modality": "TEXT",
                    "depth": 3,
                    "length": 50,
                    "interactivity": "VIEW",
                    "persistent": False,
                    "weight": 0.8
                },
                "seed": {
                    "prompt": {
                        "system_prompt": "You are an assisant that is continuously generating thoughts during an interaction with a user.",
                        "user_prompt": "What are the key data points about global warming trends?"
                    },
                    "model": "gpt-4o",
                    "temperature": 0.7,
                    "type": "analytical"
                },
                "trigger_event": {
                    "id": "event_789abc",
                    "timestamps": {
                        "created": "2023-10-15T14:29:50",
                        "updated": "2023-10-15T14:29:50"
                    },
                    "type": "WORD_COUNT_CHANGE",
                    "content": {
                        "text": "User added several words about climate change data",
                        "embedding": [0.2, 0.3, 0.4, 0.5]
                    },
                    "duration": 2.5
                },
                "references": [],
                "user_comments": [],
                "score": {
                    "weight": 0.75 # Weight is automatically evaluated when generated and can be changed by the user.
                }
            }
        }


class SimpleThoughtInput(BaseModel):
    """Simple input schema for easily creating thoughts."""
    text: str = Field(..., description="Text content of the thought")
    modality: Optional[Literal["TEXT", "EMOJI", "VISUAL"]] = Field("TEXT", description="Modality of the thought content")
    interactivity: Optional[Literal["VIEW", "COMMENT", "EDIT"]] = Field("VIEW", description="Level of interactivity allowed")
    weight: Optional[float] = Field(0.5, description="Importance weight (0-1)", ge=0.0, le=1.0)
    
    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "text": "Climate change is accelerating faster than previously predicted",
                "modality": "TEXT",
                "interactivity": "COMMENT",
                "weight": 0.8
            }
        }


async def create_thought_from_simple_input(
    input_data: SimpleThoughtInput, compute_embedding: bool = True
) -> Thought:
    """
    Create a Thought object from simple input data.
    Async because it uses the LLM to compute embeddings.

    Args:
        input_data: SimpleThoughtInput object
        compute_embedding: Whether to compute embedding for the thought content
        
    Returns:
        A fully-formed Thought object
    """

    simple_input = SimpleThoughtInput.model_validate(input_data)
    
    # Create content with embedding if requested
    embedding = None
    if compute_embedding:
        embedding = await get_embedding(simple_input.text)
    
    # Create the Thought object
    cur_timestamp=datetime.now()
    thought = Thought(
        id=f"thought_{uuid.uuid4().hex[:8]}",
        timestamps=Timestamps(
            created=cur_timestamp,
            updated=cur_timestamp
        ),
        content=Content(
            text=simple_input.text,
            embedding=embedding
        ),
        config=ThoughtConfig(
            modality=simple_input.modality,
            depth=3,
            length=5,
            interactivity=simple_input.interactivity,
            persistent=False,
            weight=simple_input.weight
        )
    )
    
    return thought


