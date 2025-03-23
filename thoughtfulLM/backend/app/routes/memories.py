from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, List
import uuid
from datetime import datetime
from pydantic import BaseModel

from app.models.memory_models import MemoryRequest
from app.stores.memory_store import memory_store
from thought_kit.schemas.memory_schema import MemoryItem
from thought_kit.schemas.common_schema import Timestamps, Content
from thought_kit.utils.llm_api import get_embedding

router = APIRouter(
    prefix="/memories",
    tags=["memories"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def add_memory(request: MemoryRequest):
    """
    Add a memory item to the store.
    
    Args:
        request: The memory item data to add
        A json object with the following fields:
        - type: The type of memory item to add (LONG_TERM or SHORT_TERM)
        - text: The text of the memory item
    
    Returns:
        The added memory item
    """
    try:
        # Calculate embedding for the memory text
        embedding = await get_embedding(request.text)
        
        # Create a MemoryItem from the request
        memory_item = MemoryItem(
            id=f"memory_item_{uuid.uuid4().hex[:8]}",
            timestamps=Timestamps(
                created=datetime.now().isoformat(),
                updated=datetime.now().isoformat()
            ),
            type=request.type,
            content=Content(
                text=request.text,
                embedding=embedding
            )
        )
        
        # Add memory item to the store
        added_item = memory_store.add_memory_item(memory_item)
        return added_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to add memory: {str(e)}"
        )

@router.get("/", status_code=status.HTTP_200_OK)
async def get_memories_by_type(memory_type: str = Query(None, description="Memory type (LONG_TERM or SHORT_TERM)")):
    """
    Get memory items by type.
    
    Args:
        memory_type: Optional memory type filter (LONG_TERM or SHORT_TERM)
                    If not provided, returns all memory items
    
    Returns:
        List of memory items filtered by type if specified
    """
    try:
        if memory_type:
            if memory_type == "LONG_TERM":
                return memory_store.get_long_term_memory()
            elif memory_type == "SHORT_TERM":
                return memory_store.get_short_term_memory()
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid memory type: {memory_type}. Valid types are LONG_TERM and SHORT_TERM"
                )
        else:
            # Return all memory
            return memory_store.get_all_memory()
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get memories: {str(e)}"
        )

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_memories():
    """
    Clear all memories from the store.
    """
    try:
        memory_store.clear()
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to clear memories: {str(e)}"
        )