from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, Literal

# Import ThoughtKit schemas
from thought_kit.schemas.memory_schema import MemoryItem
from thought_kit.schemas.common_schema import Content

class MemoryRequest(BaseModel):
    """Request model for adding a memory item"""
    type: Literal["LONG_TERM", "SHORT_TERM"] = Field(..., description="Type of memory (long-term or short-term)")
    text: str = Field(..., description="Text of the memory")
    
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "type": "LONG_TERM",
                "text": "The user is interested in climate change data"
            }
        }
    ) 