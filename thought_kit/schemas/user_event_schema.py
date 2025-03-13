from typing import Literal, Optional, Union, Dict, Any
from pydantic import BaseModel, Field
import json
import uuid

from .common_schema import Timestamps, Content
from ..utils.llm_api import get_embedding_sync


class UserEventType(str, Literal["IDLE", "NEW_INPUT", "TIME_INTERVAL", "INTERRUPT"]):
    """Type of user event."""
    pass


class UserEvent(BaseModel):
    """Schema for a user event in the thought-kit system."""
    id: str = Field(..., description="Unique identifier for this user event")
    timestamps: Timestamps = Field(default_factory=Timestamps, description="Timestamp information")
    content: Content = Field(..., description="Content of the user event")
    type: UserEventType = Field(..., description="Type of user event")
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
                "type": "NEW_INPUT",
                "content": {
                    "text": "User asked about climate change data",
                    "embedding": [0.1, 0.2, 0.3, 0.4]
                },
                "duration": 5.2
            }
        }


class SimpleUserEventInput(BaseModel):
    """Simple input schema for creating user events."""
    text: str = Field(..., description="Text content of the user event")
    type: UserEventType = Field(..., description="Type of user event")
    duration: Optional[float] = Field(None, description="Duration of the event in seconds, if applicable")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "text": "User asked about climate change data",
                "type": "NEW_INPUT",
                "duration": 5.2
            }
        }


# JSON Conversion Utilities

def user_event_to_json(user_event: UserEvent, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a UserEvent object to a JSON string or dictionary.
    
    Args:
        user_event: The UserEvent object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the UserEvent
    """
    if as_string:
        return user_event.model_dump_json(indent=2)
    return user_event.model_dump()


def json_to_user_event(input_data: Union[str, Dict[str, Any]]) -> UserEvent:
    """
    Convert a JSON string or dictionary to a UserEvent object.
    
    Args:
        input_data: Either a JSON string or dictionary with user event fields
        
    Returns:
        A UserEvent object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return UserEvent.model_validate(data)


def json_to_simple_user_event_input(input_data: Union[str, Dict[str, Any]]) -> SimpleUserEventInput:
    """
    Convert a JSON string or dictionary to a SimpleUserEventInput object.
    
    Args:
        input_data: Either a JSON string or dictionary with simple user event fields
        
    Returns:
        A SimpleUserEventInput object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return SimpleUserEventInput.model_validate(data)


def create_user_event_from_simple_input(simple_input: SimpleUserEventInput, compute_embedding: bool = True) -> UserEvent:
    """
    Create a UserEvent object from a SimpleUserEventInput.
    
    Args:
        simple_input: SimpleUserEventInput object with basic user event information
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A UserEvent object with properly structured fields and computed embedding
    """
    
    # Get embedding for the text content
    embedding = get_embedding_sync(simple_input.text) if compute_embedding and simple_input.text.strip() else None
    
    return UserEvent(
        id=f"event_{uuid.uuid4().hex[:8]}",
        timestamps=Timestamps(),
        content=Content(
            text=simple_input.text,
            embedding=embedding
        ),
        type=simple_input.type,
        duration=simple_input.duration
    )


def simple_json_to_user_event(input_data: Union[str, Dict[str, Any]], compute_embedding: bool = True) -> UserEvent:
    """
    Convert a simple JSON string or dictionary to a UserEvent object.
    
    Args:
        input_data: Either a JSON string or dictionary with user event fields
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A UserEvent object with properly structured fields
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    simple_input = SimpleUserEventInput(**data)
    return create_user_event_from_simple_input(simple_input, compute_embedding)
