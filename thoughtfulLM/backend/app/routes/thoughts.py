from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any, List, Optional
from app.models.thought_models import GenerationRequest, OperationRequest, ArticulationRequest
from app.stores.thought_store import thought_store
from app.stores.memory_store import memory_store
from thought_kit import thoughtkit
import random
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
        #See all the available thought seeds
        available_seeds = thoughtkit.get_available_thought_seeds()
        # randomly select one, TEMPORARY for TESTING
        # TODO: Implement a way to select the best seed based on the event, probably prompt based?
        seed_name = available_seeds[random.randint(0, len(available_seeds) - 1)]
        
        # Create the input data dictionary
        input_data = {
            "event": {
                "text": request.event_text,
                "type": request.event_type,
                "duration": -1
            },
            "seed": thoughtkit.load_thought_seed(seed_name),
            "config": {
                "modality": "TEXT",
                "depth": 3,
                "length": 5,
                "interactivity": "EDIT",
                "persistent": False,
                "weight": 0.5
            },
            "memory": memory_store.get_all_memory(),
            "thoughts": thought_store.get_all_thoughts()
        }

        # Use the single parameter format
        result = await thoughtkit.generate(input_data, return_json_str=False, return_model=True)

        # Add the thought to the thought store
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
        
        # Perform operation using ThoughtKit directly
        result = await thoughtkit.operate(request_data, return_json_str=False, return_model=True)
        
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
                optional memory, and articulation options
    
    Returns:
        The articulated response
    """
    try:
        # Convert Pydantic model to dict
        request_data = request.model_dump(exclude_none=True)
        
        # Specify the model, temperature, and max tokens for the articulation
        request_data["model"] = "gpt-4o"
        request_data["temperature"] = 0.7
        request_data["max_tokens"] = 500
        
        # Articulate thoughts using ThoughtKit directly
        result = await thoughtkit.articulate(request_data)
        
        return {"response": result}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to articulate thoughts: {str(e)}"
        )


# Operations for the thought store
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

@router.delete("/", status_code=status.HTTP_204_NO_CONTENT)
async def clear_all_thoughts():
    """
    Clear all thoughts from the store.
    """
    try:
        thought_store.clear()
        return None
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to clear thoughts: {str(e)}"
        ) 