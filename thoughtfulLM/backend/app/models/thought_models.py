from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any, Union, Literal

# Placeholder models - these will eventually mirror ThoughtKit schemas
class ThoughtRequest(BaseModel):
    """Request model for generating thoughts"""
    event: Dict[str, Any] = Field(..., description="Information about the user's current interaction")
    seed: Dict[str, Any] = Field(..., description="Configuration for generating the thought")
    config: Dict[str, Any] = Field(..., description="Configuration for how the thought should behave")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
    thoughts: Optional[List[Dict[str, Any]]] = Field(None, description="Previous thoughts for context")

class OperationRequest(BaseModel):
    """Request model for thought operations"""
    operation: str = Field(..., description="Name of the operation to perform")
    thoughts: List[Dict[str, Any]] = Field(..., description="List of thoughts to operate on")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
    options: Optional[Dict[str, Any]] = Field(None, description="Additional options for the operation")

class ArticulationRequest(BaseModel):
    """Request model for thought articulation"""
    thoughts: List[Dict[str, Any]] = Field(..., description="List of thoughts to articulate")
    memory: Optional[Dict[str, Any]] = Field(None, description="Memory context")
    model: Optional[str] = Field("gpt-4o", description="LLM model to use")
    temperature: Optional[float] = Field(0.7, description="Temperature for LLM")
    max_tokens: Optional[int] = Field(500, description="Max tokens for response") 