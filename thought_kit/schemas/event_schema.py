from typing import Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
import json
import uuid
from datetime import datetime

from .common_schema import Timestamps, Content
from ..utils.llm_api import get_embedding


class Event(BaseModel):
    """Schema for a event that would trigger a thought."""
    id: str = Field(..., description="Unique identifier for this event")
    timestamps: Timestamps = Field(default_factory=Timestamps, description="Timestamp information")
    content: Content = Field(..., description="Content of the event")
    type: Literal["IDLE", "USER_INPUT", "TIME_INTERVAL", "INTERRUPT", "DIRECT_CREATION"] = Field(..., description="Type of event")
    duration: Optional[float] = Field(None, description="Duration of the event in seconds, if applicable")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "event_123456",
                "timestamps": {
                    "created": "2023-10-15T14:30:00",
                    "updated": "2023-10-15T14:30:00"
                },
                "type": "USER_INPUT",
                "content": {
                    "text": "User asked about climate change data",
                    "embedding": [0.1, 0.2, 0.3, 0.4]
                },
                "duration": None
            }
        }


class SimpleEventInput(BaseModel):
    """Simple input schema for creating events."""
    text: str = Field(..., description="Text content of the event")
    type: Literal["IDLE", "USER_INPUT", "TIME_INTERVAL", "INTERRUPT"] = Field(..., description="Type of event")
    duration: Optional[float] = Field(None, description="Duration of the event in seconds, if applicable")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "text": "User asked about climate change data",
                "type": "USER_INPUT",
                "duration": None
            }
        }


async def create_event_from_simple_input(
    input_data: SimpleEventInput, compute_embedding: bool = True
) -> Event:
    """
    Create a Event object from simple input data.
    Async because it uses the LLM to compute embeddings.
    
    Args:
        input_data: SimpleEventInput object
        compute_embedding: Whether to compute embedding for the event content
        
    Returns:
        A fully-formed Event object
    """ 
    simple_input = SimpleEventInput.model_validate(input_data)
    
    # Create content with embedding if requested
    embedding = None
    if compute_embedding:
        embedding = await get_embedding(simple_input.text)
    
    # Create the Event object
    cur_timestamp=datetime.now()
    event = Event(
        id=f"event_{uuid.uuid4().hex[:8]}",
        timestamps=Timestamps(
            created=cur_timestamp,
            updated=cur_timestamp
        ),  
        content=Content(
            text=simple_input.text,
            embedding=embedding
        ),
        type=simple_input.type,
        duration=simple_input.duration
    )
    
    return event
