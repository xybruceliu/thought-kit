from fastapi import APIRouter, HTTPException, status, Query
from typing import Dict, Any, List
import uuid
from datetime import datetime

from app.models.memory_models import MemoryRequest
from thought_kit.schemas.memory_schema import MemoryItem
from thought_kit.schemas.common_schema import Timestamps, Content
from thought_kit.utils.llm_api import get_embedding

router = APIRouter(
    prefix="/memories",
    tags=["memories"],
    responses={404: {"description": "Not found"}},
)

@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_memory(request: MemoryRequest):
    """
    Create a new memory item.
    
    Args:
        request: The memory item data to create
        A json object with the following fields:
        - type: The type of memory item to add (LONG_TERM or SHORT_TERM)
        - text: The text of the memory item
    
    Returns:
        The created memory item (to be stored in the frontend)
    """
    try:
        # Calculate embedding for the memory text
        # embedding = await get_embedding(request.text)
        embedding = None
        
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
        
        # Return the created memory item for frontend storage
        return memory_item
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to create memory: {str(e)}"
        )