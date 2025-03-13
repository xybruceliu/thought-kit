from typing import List, Optional, Dict, Any, Literal, Union
from pydantic import BaseModel, Field
import json
import uuid

from .common_schema import Content, Timestamps
from ..utils.text_splitter import SentenceSplitter
from ..utils.llm_api import get_embedding_sync

class MemoryItem(BaseModel):
    """Schema for a single memory item."""
    id: str = Field(..., description="Unique memory index or identifier")
    timestamp: Timestamps = Field(default_factory=Timestamps, description="Timestamp information")
    type: Literal["LONG_TERM", "SHORT_TERM"] = Field(..., description="Type of memory (long-term or short-term)")
    content: Content = Field(..., description="Content of the memory")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "id": "memory_abc123",
                "timestamp": {
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
        description="Array of MemoryItem objects for persistent knowledge"
    )
    short_term: List[MemoryItem] = Field(
        default_factory=list, 
        description="Array of MemoryItem objects for transient/ephemeral knowledge"
    )

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "long_term": [
                    {
                        "id": "memory_abc123",
                        "timestamp": {
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
                "short_term": [
                    {
                        "id": "memory_def456",
                        "timestamp": {
                            "created": "2023-10-15T14:35:00",
                            "updated": "2023-10-15T14:35:00"
                        },
                        "type": "SHORT_TERM",
                        "content": {
                            "text": "The user asked about global temperature trends",
                            "embedding": [0.2, 0.3, 0.4, 0.5]
                        }
                    }
                ]
            }
        }


class SimpleMemoryInput(BaseModel):
    """Simple input schema for creating memories."""
    long_term: Optional[str] = Field(None, description="Paragraph of long-term memory")
    short_term: Optional[str] = Field(None, description="Paragraph of short-term memory")

    class Config:
        """Pydantic config"""
        json_schema_extra = {
            "example": {
                "long_term": "The user is interested in climate change data",
                "short_term": "The user just asked about the impact of climate change on agriculture in the next decade. They mentioned they are working on a research paper."
            }
        }               


# JSON Conversion Utilities

def memory_to_json(memory: Memory, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a Memory object to a JSON string or dictionary.
    
    Args:
        memory: The Memory object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the Memory
    """
    if as_string:
        return memory.model_dump_json(indent=2)
    return memory.model_dump()


def json_to_memory(input_data: Union[str, Dict[str, Any]]) -> Memory:
    """
    Convert a JSON string or dictionary to a Memory object.
    
    Args:
        input_data: Either a JSON string or dictionary with memory fields
        
    Returns:
        A Memory object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return Memory.model_validate(data)


def memory_item_to_json(memory_item: MemoryItem, as_string: bool = True) -> Union[str, Dict[str, Any]]:
    """
    Convert a MemoryItem object to a JSON string or dictionary.
    
    Args:
        memory_item: The MemoryItem object to convert
        as_string: Whether to return a JSON string (True) or a dictionary (False)
        
    Returns:
        A JSON string or dictionary representation of the MemoryItem
    """
    if as_string:
        return memory_item.model_dump_json(indent=2)
    return memory_item.model_dump()


def json_to_memory_item(input_data: Union[str, Dict[str, Any]]) -> MemoryItem:
    """
    Convert a JSON string or dictionary to a MemoryItem object.
    
    Args:
        input_data: Either a JSON string or dictionary with memory item fields
        
    Returns:
        A MemoryItem object
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    return MemoryItem.model_validate(data)


def create_memory_from_simple_input_sync(simple_input: SimpleMemoryInput, compute_embedding: bool = True) -> Memory:
    """
    Create a Memory object from a simple input with just long_term and short_term paragraphs.
    Uses synchronous embedding generation.
    
    Args:
        simple_input: SimpleMemoryInput object containing long_term and short_term fields
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A Memory object with properly structured memory items
    """
    
    memory = Memory()
    splitter = SentenceSplitter()
    
    # Process long-term memory if provided
    if simple_input.long_term:
        sentences = splitter.split_sentences(simple_input.long_term)
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            embedding = get_embedding_sync(sentence) if compute_embedding and sentence.strip() else None
            memory_item = MemoryItem(
                id=f"memory_lt_{uuid.uuid4().hex[:8]}",
                type="LONG_TERM",
                content=Content(
                    text=sentence,
                    embedding=embedding
                ),
                timestamp=Timestamps()
            )
            memory.long_term.append(memory_item)
    
    # Process short-term memory if provided
    if simple_input.short_term:
        sentences = splitter.split_sentences(simple_input.short_term)
        for sentence in sentences:
            if not sentence.strip():
                continue
                
            embedding = get_embedding_sync(sentence) if compute_embedding and sentence.strip() else None
            memory_item = MemoryItem(
                id=f"memory_st_{uuid.uuid4().hex[:8]}",
                type="SHORT_TERM",
                content=Content(
                    text=sentence,
                    embedding=embedding
                ),
                timestamp=Timestamps()
            )
            memory.short_term.append(memory_item)
    
    return memory


def simple_json_to_memory(input_data: Union[str, Dict[str, Any]], compute_embedding: bool = True) -> Memory:
    """
    Convert a simple JSON string or dictionary to a Memory object.
    
    Args:
        input_data: Either a JSON string or dictionary with long_term and short_term fields
        compute_embedding: Whether to compute embeddings for the text content (default: True)
        
    Returns:
        A Memory object with properly structured memory items
    """
    if isinstance(input_data, str):
        data = json.loads(input_data)
    else:
        data = input_data
        
    simple_input = SimpleMemoryInput(**data)
    return create_memory_from_simple_input_sync(simple_input, compute_embedding)
