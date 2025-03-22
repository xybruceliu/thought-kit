from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Optional, Any, Union, Literal

# Import ThoughtKit schemas
from thought_kit.schemas.thought_schema import Thought, ThoughtConfig, ThoughtSeed
from thought_kit.schemas.event_schema import Event, SimpleEventInput
from thought_kit.schemas.memory_schema import Memory
from thought_kit.schemas.common_schema import Content

# Define event types directly using Literal instead of importing EventType
EventTypes = Literal["CLICK", "IDLE_TIME", "WORD_COUNT_CHANGE", "SENTENCE_END", "NAMED_ENTITY"]

# Request models aligned with ThoughtKit API parameters
class GenerationRequest(BaseModel):
    """Request model for generating thoughts"""
    event_text: str = Field(..., description="Text of the event")
    event_type: EventTypes = Field(..., description="Type of event")
    event_duration: float = Field(..., description="Duration of the event")
    

    event: SimpleEventInput = Field(..., description="Information about the user's current interaction")
    seed: ThoughtSeed = Field(..., description="Configuration for generating the thought")
    config: ThoughtConfig = Field(..., description="Configuration for how the thought should behave")
    memory: Optional[Memory] = Field(None, description="Memory context")
    thoughts: Optional[List[Thought]] = Field(None, description="Previous thoughts for context")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "event": {
                    "text": "I'm researching the impact of AI on society.",
                    "type": "WORD_COUNT_CHANGE",
                    "duration": -1
                },
                "seed": {
                    "prompt": {
                        "system_prompt": "You are a thoughtful AI assistant.",
                        "user_prompt": "Generate a thought about the user's research topic."
                    },
                    "model": "gpt-4o-mini",
                    "temperature": 0.7,
                    "type": "reflective",
                    "max_tokens": 100
                },
                "config": {
                    "modality": "TEXT",
                    "depth": 3,
                    "length": 5,
                    "interactivity": "COMMENT",
                    "persistent": False,
                    "weight": 0.8
                }
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
                "options": {
                    "amount": 0.2
                }
            }
        }
    )

class ArticulationRequest(BaseModel):
    """Request model for thought articulation"""
    thoughts: List[Thought] = Field(..., description="List of thoughts to articulate")
    memory: Optional[Memory] = Field(None, description="Memory context")
    model: Optional[str] = Field("gpt-4o", description="LLM model to use")
    temperature: Optional[float] = Field(0.7, description="Temperature for LLM")
    max_tokens: Optional[int] = Field(500, description="Max tokens for response")
    
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
                            "weight": 0.7
                        }
                    },
                    {
                        "id": "thought-456",
                        "content": {
                            "text": "But we need to consider privacy implications for patient data."
                        },
                        "config": {
                            "modality": "TEXT",
                            "depth": 4,
                            "length": 12,
                            "interactivity": "VIEW",
                            "persistent": True,
                            "weight": 0.9
                        }
                    }
                ],
                "model": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 500
            }
        }
    ) 
