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
    """Request model for generating thoughts"""
    event_text: str = Field(..., description="Text of the event")
    event_type: EventTypes = Field(..., description="Type of event")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event_text": "I'm researching the impact of AI on society.",
                "event_type": "WORD_COUNT_CHANGE"
            }   
        }
    )

class OperationRequest(BaseModel):
    """Request model for thought operations"""
    operation: str = Field(..., description="Name of the operation to perform")
    thoughts: List[Thought] = Field(..., description="List of thoughts to operate on")
    memory: Optional[Memory] = Field(None, description="Memory context")
    options: Optional[Dict[str, Any]] = Field(None, description="Additional options for the operation")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "operation": "like",
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
                },
                "options": {}
            }
        }
    )

class ArticulationRequest(BaseModel):
    """Request model for thought articulation"""
    thoughts: List[Thought] = Field(..., description="List of thoughts to articulate")
    memory: Optional[Memory] = Field(None, description="Memory context")

    model_config = ConfigDict(
        json_schema_extra={
            "example": {
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
    