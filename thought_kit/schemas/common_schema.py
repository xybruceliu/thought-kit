from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
import json


class Timestamps(BaseModel):
    """Timestamp information for entities in the system."""
    created: datetime = Field(default_factory=datetime.now, description="When the entity was created")
    updated: datetime = Field(default_factory=datetime.now, description="When the entity was last modified")


class Content(BaseModel):
    """Content class for thought and memory content."""
    text: str = Field(..., description="Textual content")
    embedding: Optional[List[float]] = Field(
        None, description="Vector embedding representing the semantic content"
    )


class Prompt(BaseModel):
    """Prompt configuration for LLM interactions."""
    system_prompt: str = Field(..., description="System instructions for the LLM")
    user_prompt: str = Field(..., description="User query or instruction for the LLM")


class Score(BaseModel):
    """Scoring metrics for ranking and prioritization."""
    weight: float = Field(
        0.0, description="Numeric measure of importance or confidence (0-1 range).", ge=0.0, le=1.0
    )
    saliency: float = Field(
        0.0, description="Measure of prominence/priority (0-1 range).", ge=0.0, le=1.0
    )


# JSON Conversion Utilities
def prompt_to_json(prompt: Prompt, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a Prompt object to a JSON string or dictionary.
    
    Args:
        prompt: The Prompt object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the Prompt
    """
    if as_string:
        return prompt.model_dump_json(indent=2)
    return prompt.model_dump()


def json_to_prompt(input_data: Union[str, Dict[str, Any]]) -> Prompt:
    """
    Convert a JSON string or dictionary to a Prompt object.
    
    Args:
        input_data: Either a JSON string or dictionary with prompt fields
        
    Returns:
        A Prompt object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return Prompt.model_validate(data) 