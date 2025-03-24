from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Optional, Any, Literal

# Import ThoughtKit schemas
from thought_kit.schemas.thought_schema import Thought
from thought_kit.schemas.memory_schema import Memory

# Define event types directly using Literal instead of importing EventType
EventTypes = Literal["CLICK", "IDLE_TIME", "WORD_COUNT_CHANGE", "SENTENCE_END", "NAMED_ENTITY"]

# Request models aligned with ThoughtKit API parameters
# User only needs to provide: event_text, event_type
# All other fields are optional and will be automatically determined by the system
class GenerationRequest(BaseModel):
    """
    Model for thought generation request.
    """
    event_text: str = Field(..., description="The event text that triggered the thought generation")
    event_type: str = Field(..., description="The type of event that triggered the thought generation")
    # Add fields for frontend-stored data
    thoughts: List[Thought] = Field(default_factory=list, description="List of thoughts from the frontend")
    memory: Optional[Memory] = Field(None, description="Memory from the frontend")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_text": "I'm researching the impact of AI on society.",
                "event_type": "WORD_COUNT_CHANGE",
                "thoughts": [
                    {
                        "id": "thought-123",
                        "content": {
                            "text": "AI could revolutionize healthcare by enabling faster diagnoses."
                        },
                        "config": {
                            "modality": "TEXT",
                            "depth": 3,
                            "length": 10,
                            "interactivity": "VIEW",
                            "persistent": False,
                            "weight": 0.5
                        }
                    }
                ],
                "memory": {
                    "long_term": [],
                    "short_term": []
                }
            }   
        }
    )

class OperationRequest(BaseModel):
    """
    Model for thought operation request.
    """
    operation: str = Field(..., description="Name of the operation to perform")
    thoughts: List[Thought] = Field(..., description="List of thoughts to operate on")
    options: Optional[Dict[str, Any]] = Field(None, description="Optional operation parameters")
    # Add field for frontend-stored memory
    memory: Optional[Memory] = Field(None, description="Memory from the frontend")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "operation": "like",
                "thoughts": [
                    {
                        "id": "thought-123",
                        "content": {
                            "text": "AI could revolutionize healthcare by enabling faster diagnoses."
                        }
                    }
                ],
                "memory": {
                    "long_term": [],
                    "short_term": []
                }
            }   
        }
    )

class ArticulationRequest(BaseModel):
    """
    Model for thought articulation request.
    """
    thoughts: List[Thought] = Field(..., description="List of thoughts to articulate")
    # Add field for frontend-stored memory
    memory: Optional[Memory] = Field(None, description="Memory from the frontend")
    options: Optional[Dict[str, Any]] = Field(None, description="Optional articulation parameters")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "thoughts": [
                    {
                        "id": "thought-123",
                        "content": {
                            "text": "AI could revolutionize healthcare by enabling faster diagnoses."
                        }
                    }
                ],
                "memory": {
                    "long_term": [],
                    "short_term": []
                }
            }   
        }
    )
    
class ThoughtUpdateRequest(BaseModel):
    """Request model for updating thought properties"""
    # The thought to update
    thought: Thought = Field(..., description="The thought to update")
    
    # Score properties
    weight: Optional[float] = Field(None, description="New weight value (0-1)", ge=0.0, le=1.0)
    saliency: Optional[float] = Field(None, description="New saliency value (0-1)", ge=0.0, le=1.0)
    
    # Config properties
    persistent: Optional[bool] = Field(None, description="Whether the thought should be persistent")
    interactivity: Optional[Literal["VIEW", "COMMENT", "EDIT"]] = Field(None, description="Interactivity level")
    
    # Content properties
    content_text: Optional[str] = Field(None, description="Updated thought content text")
    
    # Allow a user comment to be added
    add_user_comment: Optional[str] = Field(None, description="User comment to add to the thought")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "thought": {
                    "id": "thought-123",
                    "content": {
                        "text": "AI could revolutionize healthcare by enabling faster diagnoses."
                    },
                    "config": {
                        "modality": "TEXT",
                        "depth": 3,
                        "length": 10,
                        "interactivity": "VIEW",
                        "persistent": False,
                        "weight": 0.5
                    },
                    "score": {
                        "weight": 0.5,
                        "saliency": 0.7
                    }
                },
                "weight": 0.7,
                "saliency": 0.8,
                "persistent": True,
                "interactivity": "EDIT",
                "content_text": "Updated thought content",
                "add_user_comment": "This thought is important"
            }
        }
    )
    