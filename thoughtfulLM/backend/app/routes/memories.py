from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any
import uuid
from datetime import datetime

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