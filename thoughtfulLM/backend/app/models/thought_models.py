from pydantic import BaseModel, Field, ConfigDict
from typing import Dict, List, Optional, Any, Union, Literal

# Placeholder models - these will eventually mirror ThoughtKit schemas
class ThoughtRequest(BaseModel):
    """Request model for generating thoughts"""
    event: Dict[str, Any] = Field(..., description="Information about the user's current interaction")
    seed: Dict[str, Any] = Field(..., description="Configuration for generating the thought")
    config: Dict[str, Any] = Field(..., description="Configuration for how the thought should behave")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
    thoughts: Optional[List[Dict[str, Any]]] = Field(None, description="Previous thoughts for context")
    
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
    thoughts: List[Dict[str, Any]] = Field(..., description="List of thoughts to operate on")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
    options: Optional[Dict[str, Any]] = Field(None, description="Additional options for the operation")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "operation": "like",
                "thoughts": [
                    {
                        "id": "thought-123",
                        "content": {
                            "text": "AI could revolutionize healthcare by enabling faster diagnoses.",
                            "modality": "TEXT"
                        },
                        "config": {
                            "weight": 0.5,
                            "persistent": False
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
    thoughts: List[Dict[str, Any]] = Field(..., description="List of thoughts to articulate")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
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
                            "text": "AI could revolutionize healthcare by enabling faster diagnoses.",
                            "modality": "TEXT"
                        },
                        "config": {
                            "weight": 0.7,
                            "persistent": False
                        }
                    },
                    {
                        "id": "thought-456",
                        "content": {
                            "text": "But we need to consider privacy implications for patient data.",
                            "modality": "TEXT"
                        },
                        "config": {
                            "weight": 0.9,
                            "persistent": True
                        }
                    }
                ],
                "model": "gpt-4o",
                "temperature": 0.7,
                "max_tokens": 500
            }
        }
    ) 