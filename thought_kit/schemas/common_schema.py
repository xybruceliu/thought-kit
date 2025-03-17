from datetime import datetime
from typing import List, Optional, Union, Dict, Any
from pydantic import BaseModel, Field


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
        0.0, description="User-defined weight (0-1) for the thought", ge=0.0, le=1.0
    )
    saliency: float = Field(
        0.0, description="Saliency score (0-1) for the thought, evaluated holistically by the system", ge=0.0, le=1.0
    ) 