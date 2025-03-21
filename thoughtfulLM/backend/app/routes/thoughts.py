from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List, Optional
from app.models.thought_models import GenerationRequest, OperationRequest, ArticulationRequest, TriggerRequest
from app.services.thoughtkit_client import thoughtkit_client
from app.services.thought_store import thought_store
from app.services.thought_generator import thought_generator

router = APIRouter(
    prefix="/thoughts",
    tags=["thoughts"],
    responses={404: {"description": "Not found"}},
)

@router.post("/generate", status_code=status.HTTP_201_CREATED)
async def generate_thought(request: GenerationRequest):
    """
    Generate a thought based on the provided input.
    This endpoint connects to ThoughtKit's generate function.
    
    Args:
        request: Parameters for thought generation including event, seed, config,
                and optional memory and previous thoughts
    
    Returns:
        The generated thought
    """
    try:
        # Convert Pydantic model to dict
        request_data = request.model_dump(exclude_none=True)
        
        # Generate thought using ThoughtKit
        result = await thoughtkit_client.generate_thought(request_data)
        
        # Add the thought to our store
        thought_store.add_thought(result)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to generate thought: {str(e)}"
        )

@router.post("/operate", status_code=status.HTTP_200_OK)
async def operate_on_thought(request: OperationRequest):
    """
    Perform an operation on thoughts.
    This endpoint connects to ThoughtKit's operate function.
    
    Args:
        request: Parameters for the operation including the operation name,
                thoughts to operate on, and optional memory and options
    
    Returns:
        The result of the operation
    """
    try:
        # Convert Pydantic model to dict
        request_data = request.model_dump(exclude_none=True)
        
        # Perform operation using ThoughtKit
        result = await thoughtkit_client.operate_on_thought(request_data)
        
        # Update or add thoughts to our store
        for thought in result if isinstance(result, list) else [result]:
            existing_thought = thought_store.get_thought(thought.id)
            if existing_thought:
                thought_store.update_thought(thought.id, thought)       
            else:
                thought_store.add_thought(thought)
        
        return result
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to perform operation: {str(e)}"
        )

@router.post("/articulate", status_code=status.HTTP_200_OK)
async def articulate_thoughts(request: ArticulationRequest):
    """
    Articulate thoughts into a coherent response.
    This endpoint connects to ThoughtKit's articulate function.
    
    Args:
        request: Parameters for articulation including thoughts to articulate,
                and optional memory, model, temperature, and max_tokens
    
    Returns:
        The articulated response
    """
    try:
        # Convert Pydantic model to dict
        request_data = request.model_dump(exclude_none=True)
        
        # Articulate thoughts using ThoughtKit
        result = await thoughtkit_client.articulate_thoughts(request_data)
        return {"response": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to articulate thoughts: {str(e)}"
        )

# New endpoints for thought store management

@router.post("/trigger", status_code=status.HTTP_201_CREATED)
async def trigger_thought(request: TriggerRequest):
    """
    Generate a thought based on a trigger event.
    This endpoint uses the local thought generator to create thoughts based on events.
    
    Args:
        request: Parameters for triggering a thought including event type and content
    
    Returns:
        The generated thought
    """
    try:
        # Generate a thought based on the trigger
        thought = await thought_generator.generate_thought_from_event(
            event_type=request.type,
            event_text=request.text,
            event_duration=request.duration
        )
        
        return thought
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to trigger thought: {str(e)}"
        )

@router.get("/", status_code=status.HTTP_200_OK)
async def get_all_thoughts():
    """
    Get all thoughts from the store.
    
    Returns:
        A list of all thoughts
    """
    try:
        thoughts = thought_store.get_all_thoughts()
        return thoughts
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to get thoughts: {str(e)}"
        )

@router.get("/{thought_id}", status_code=status.HTTP_200_OK)
async def get_thought(thought_id: str):
    """
    Get a thought by ID.
    
    Args:
        thought_id: The ID of the thought to get
    
    Returns:
        The thought if found
    """
    try:
        thought = thought_store.get_thought(thought_id)
        if not thought:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Thought with ID {thought_id} not found"
            )
        return thought
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to get thought: {str(e)}"
        )

@router.delete("/{thought_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_thought(thought_id: str):
    """
    Delete a thought by ID.
    
    Args:
        thought_id: The ID of the thought to delete
    """
    try:
        success = thought_store.remove_thought(thought_id)
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Thought with ID {thought_id} not found"
            )
        return None
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to delete thought: {str(e)}"
        )

@router.post("/max-count", status_code=status.HTTP_200_OK)
async def set_max_thought_count(max_count: int):
    """
    Set the maximum number of thoughts to store.
    
    Args:
        max_count: The maximum number of thoughts
    
    Returns:
        A confirmation message
    """
    try:
        thought_store.set_max_thought_count(max_count)
        return {"message": f"Max thought count set to {max_count}"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to set max thought count: {str(e)}"
        ) 