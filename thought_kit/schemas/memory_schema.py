from typing import List, Optional, Dict, Any, Literal, Union
from pydantic import BaseModel, Field
import json
import uuid
from datetime import datetime

from .common_schema import Content, Timestamps
from ..utils.text_splitter import SentenceSplitter
from ..utils.llm_api import get_embedding

class MemoryItem(BaseModel):
    """Schema for a single memory item."""
    id: str = Field(..., description="Unique memory index or identifier")
    timestamps: Timestamps = Field(default_factory=Timestamps, description="Timestamp information")
    type: Literal["LONG_TERM", "SHORT_TERM"] = Field(..., description="Type of memory (long-term or short-term)")
    content: Content = Field(..., description="Content of the memory")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "memory_abc123",
                "timestamps": {
                    "created": "2023-10-15T14:30:00",
                    "updated": "2023-10-15T14:30:00"
                },
                "type": "LONG_TERM",
                "content": {
                    "text": "The user is interested in climate change data",
                    "embedding": [0.1, 0.2, 0.3, 0.4]
                }
            }
        }


class Memory(BaseModel):
    """Schema for the memory structure containing long-term and short-term memories."""
    long_term: List[MemoryItem] = Field(
        default_factory=list, 
        description="Array of MemoryItem objects for long-term memory"
    )
    short_term: List[MemoryItem] = Field(
        default_factory=list, 
        description="Array of MemoryItem objects for short-term memory"
    )

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "long_term": [
                    {
                        "id": "memory_abc123",
                        "timestamps": {
                            "created": "2023-10-15T14:30:00",
                            "updated": "2023-10-15T14:30:00"
                        },
                        "type": "LONG_TERM",
                        "content": {
                            "text": "The user is interested in climate change data",
                            "embedding": [0.1, 0.2, 0.3, 0.4]
                        }
                    }
                ],
                "short_term": []
            }
        }


class SimpleMemoryInput(BaseModel):
    """Simple input schema for creating memories. This is used to quickly create a memory from a simple input string."""
    long_term: Optional[str] = Field(None, description="Paragraph of long-term memory")
    short_term: Optional[str] = Field(None, description="Paragraph of short-term memory")
    
    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "long_term": "The user expressed interest in climate change data and policy implications. They are interested in the impact of climate change on global temperatures and the role of human activity in causing it.",
                "short_term": "The user just asked about recent temperature trends."
            }
        }


async def create_memory_from_simple_input(
    input_data: SimpleMemoryInput, compute_embedding: bool = True
) -> Memory:
    """
    Create a Memory object from simple input data.
    Async because it uses the LLM to compute embeddings.
    
    Args:
        input_data: SimpleMemoryInput object
        compute_embedding: Whether to compute embedding for the memory content
        
    Returns:
        A fully-formed Memory object
    """

    simple_input = SimpleMemoryInput.model_validate(input_data)
    
    # Create a new Memory object
    memory = Memory(
        long_term=[],
        short_term=[]
    )
    
    # Process long-term memory if provided
    if simple_input.long_term:      
        # Split long-term memory into sentences
        splitter = SentenceSplitter()
        long_term_sentences = splitter.split_text(simple_input.long_term)
        
        # Create memory items for each sentence
        for sentence in long_term_sentences:
            if sentence.strip():
                embedding = None
                if compute_embedding:
                    embedding = await get_embedding(sentence)

                cur_timestamp = datetime.now().isoformat()
                memory_item = MemoryItem(
                    id=f"memory_item_{uuid.uuid4().hex[:8]}",
                    timestamps=Timestamps(
                        created=cur_timestamp,
                        updated=cur_timestamp
                    ),
                    type="LONG_TERM",
                    content=Content(
                        text=sentence,
                        embedding=embedding
                    )
                )
                memory.long_term.append(memory_item)
    
    # Process short-term memory if provided
    if simple_input.short_term:
        # Split short-term memory into sentences
        splitter = SentenceSplitter()   
        short_term_sentences = splitter.split_text(simple_input.short_term)
        
        # Create memory items for each sentence
        for sentence in short_term_sentences:
            if sentence.strip():
                embedding = None
                if compute_embedding:
                    embedding = await get_embedding(sentence)
                
                memory_item = MemoryItem(
                    id=f"memory_item_{uuid.uuid4().hex[:8]}",
                    timestamps=Timestamps(
                        created=datetime.now().isoformat(),
                        updated=datetime.now().isoformat()
                    ),
                    type="SHORT_TERM",
                    content=Content(
                        text=sentence,
                        embedding=embedding
                    )
                )
                memory.short_term.append(memory_item)
    
    
    return memory
