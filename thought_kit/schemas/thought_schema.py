from typing import List, Literal, Union, Dict, Any, Optional
from pydantic import BaseModel, Field, field_validator
import json
import uuid

from .common_schema import Timestamps, Content, Score, Prompt
from .user_event_schema import UserEvent


class ThoughtSeed(BaseModel):
    """Configuration for generating a thought. Optional because the user may create a thought directly."""
    prompt: Prompt = Field(..., description="Prompt configuration for generating the thought")
    model: Literal["gpt-4o", "gpt-4o-mini"] = Field(..., description="Model to use for generating the thought")
    temperature: float = Field(..., description="Temperature for generation (0-1)", ge=0.0, le=1.0)
    type: str = Field(..., description="Type of thought to generate, provided by the user")

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
                "type": "analytical"
            }
        }


class ThoughtConfig(BaseModel):
    """Configuration details about how this Thought should be handled. Optional because the user may create a thought directly."""
    modality: Literal["TEXT", "EMOJI", "VISUAL"] = Field(
        "TEXT", description="Modality of the thought content."
    )
    depth: int = Field(
        1, description="Numeric handle (1-5) for how detailed/abstract the thought is.", ge=1, le=5
    )
    interactivity: Literal["VIEW", "COMMENT", "EDIT"] = Field(
        "VIEW", description="Level of interactivity allowed for this thought."
    )
    persistent: bool = Field(
        False, description="Whether or not to anchor this Thought"
    )

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "modality": "TEXT",
                "depth": 3,
                "interactivity": "VIEW",
                "persistent": False
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
        None, description="Configuration used to generate this thought, if applicable."
    )

    trigger_event: Optional[UserEvent] = Field(None, description="User event that triggered this thought, if applicable")
    
    references: List[str] = Field(
        default_factory=list, description="Array of external references (e.g. memory IDs)."
    )
    
    user_comments: List[str] = Field(
        default_factory=list, description="Array of user-supplied strings (feedback, notes)."
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
                    "interactivity": "VIEW",
                    "persistent": False
                },
                "seed": {
                    "prompt": {
                        "system_prompt": "You are an analytical assistant that provides factual information about climate change.",
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
                    "type": "NEW_INPUT",
                    "content": {
                        "text": "User asked about climate change data",
                        "embedding": [0.2, 0.3, 0.4, 0.5]
                    },
                    "duration": 2.5
                },
                "references": [],
                "user_comments": [],
                "score": {
                    "weight": 0.75,
                    "saliency": 0.6
                }
            }
        }


class SimpleThoughtInput(BaseModel):
    """Simple input schema for creating thoughts directly."""
    text: str = Field(..., description="Text content of the thought")
    modality: Literal["TEXT", "EMOJI", "VISUAL"] = Field("TEXT", description="Modality of the thought content")
    interactivity: Literal["VIEW", "COMMENT", "EDIT"] = Field("VIEW", description="Level of interactivity allowed")
    weight: float = Field(0.5, description="Importance weight (0-1)", ge=0.0, le=1.0)
    
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


# JSON Conversion Utilities

def thought_to_json(thought: Thought, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a Thought object to a JSON string or dictionary.
    
    Args:
        thought: The Thought object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the Thought
    """
    if as_string:
        return thought.model_dump_json(indent=2)
    return thought.model_dump()


def json_to_thought(input_data: Union[str, Dict[str, Any]]) -> Thought:
    """
    Convert a JSON string or dictionary to a Thought object.
    
    Args:
        input_data: Either a JSON string or dictionary with thought fields
        
    Returns:
        A Thought object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return Thought.model_validate(data)


def thought_seed_to_json(thought_seed: ThoughtSeed, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a ThoughtSeed object to a JSON string or dictionary.
    
    Args:
        thought_seed: The ThoughtSeed object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the ThoughtSeed
    """
    if as_string:
        return thought_seed.model_dump_json(indent=2)
    return thought_seed.model_dump()


def json_to_thought_seed(input_data: Union[str, Dict[str, Any]]) -> ThoughtSeed:
    """
    Convert a JSON string or dictionary to a ThoughtSeed object.
    
    Args:
        input_data: Either a JSON string or dictionary with thought seed fields
        
    Returns:
        A ThoughtSeed object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return ThoughtSeed.model_validate(data)


def create_thought_from_simple_input(simple_input: SimpleThoughtInput, compute_embedding: bool = True) -> Thought:
    """
    Create a Thought object from a SimpleThoughtInput.
    
    Args:
        simple_input: SimpleThoughtInput object with basic thought information
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A Thought object with properly structured fields
    """
    from ..utils.llm_api import get_embedding_sync
    
    # Get embedding for the text content if requested
    embedding = get_embedding_sync(simple_input.text) if compute_embedding and simple_input.text.strip() else None
    
    # Create thought with default values for optional fields
    return Thought(
        id=f"thought_{uuid.uuid4().hex[:8]}",
        timestamps=Timestamps(),
        content=Content(
            text=simple_input.text,
            embedding=embedding
        ),
        config=ThoughtConfig(
            modality=simple_input.modality,
            depth=3,  # Default depth
            interactivity=simple_input.interactivity,
            persistent=False  # Default not persistent
        ),
        seed=None,  # No seed for directly created thoughts
        trigger_event=None,  # No trigger event for directly created thoughts
        references=[],  # Empty references
        user_comments=[],  # Empty user comments
        score=Score(
            weight=simple_input.weight,
            saliency=0.0  # Default saliency
        )
    )


def json_to_simple_thought_input(input_data: Union[str, Dict[str, Any]]) -> SimpleThoughtInput:
    """
    Convert a JSON string or dictionary to a SimpleThoughtInput object.
    
    Args:
        input_data: Either a JSON string or dictionary with simple thought fields
        
    Returns:
        A SimpleThoughtInput object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return SimpleThoughtInput.model_validate(data)


def simple_json_to_thought(input_data: Union[str, Dict[str, Any]], compute_embedding: bool = True) -> Thought:
    """
    Convert a simple JSON string or dictionary to a Thought object.
    
    Args:
        input_data: Either a JSON string or dictionary with simple thought fields
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A Thought object with properly structured fields
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    simple_input = SimpleThoughtInput(**data)
    return create_thought_from_simple_input(simple_input, compute_embedding)


