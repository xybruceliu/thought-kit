from fastapi import APIRouter, HTTPException, status
from app.models.thought_models import GenerationRequest, OperationRequest, ArticulationRequest
from app.stores.thought_store import thought_store
from app.stores.memory_store import memory_store
from thought_kit import thoughtkit
import random
import re
from thought_kit.schemas.memory_schema import MemoryItem
from thought_kit.schemas.common_schema import Content, Timestamps
import uuid
from datetime import datetime

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

        # Extract the last sentence from event_text
        full_text = request.event_text
        # Split by sentence-ending punctuation followed by space or end of string
        sentences = re.split(r'(?<=[.!?])\s+|(?<=[.!?])$', full_text)
        # Filter out empty strings that might result from the split
        sentences = [s for s in sentences if s.strip()]
        # Get the last sentence or the full text if no sentence endings found
        last_sentence = sentences[-1] if sentences else full_text
        
        # Create the input data dictionary
        input_data = {
            "event": {
                "text": last_sentence,  # Use only the last sentence
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
                "weight": 0.5 # weight are initialized to 0.5, this is a parameter that can be changed by the user.
            },
            "memory": memory_store.get_all_memory(),
            "thoughts": thought_store.get_all_thoughts()
        }

        # Create a clean copy of input_data for logging
        short_term_memory = memory_store.get_short_term_memory()
        if short_term_memory:
            short_term_memory_text = short_term_memory[0].content.text
        else:
            short_term_memory_text = "No short term memory yet"

        log_input_data = {
            "event": input_data["event"],
            "seed": input_data["seed"]["name"] if "name" in input_data["seed"] else "loaded_seed",
            "config": input_data["config"],
            "memory": short_term_memory_text,
            "thoughts": f"[{len(input_data['thoughts'])} thoughts]"
        }

        print("--------------------------------")
        print("🤔 New Thought Generation Request:")
        print(log_input_data)
        print("--------------------------------")

        # Use the single parameter format
        result = await thoughtkit.generate(input_data, return_json_str=False, return_model=True)

        # Add the thought to the thought store
        thought_store.add_thought(result)

        log_output_data = {
            "id": result.id,
            "content": {
                "text": result.content.text[:100] + "..." if len(result.content.text) > 100 else result.content.text
            },
            "config": {
                "modality": result.config.modality,
                "depth": result.config.depth,
                "length": result.config.length,
                "persistent": result.config.persistent,
                "weight": result.config.weight
            },
            "trigger_event": {
                "type": result.trigger_event.type,
                "text": result.trigger_event.content.text[:50] + "..." if len(result.trigger_event.content.text) > 50 else result.trigger_event.content.text
            },
            "seed": result.seed.type if result.seed else "None",
            "score": {
                "weight": result.score.weight,
                "saliency": result.score.saliency
            }
        }

        print("--------------------------------")
        print("💭 New Thought Generation Response:")
        print(log_output_data)
        print("--------------------------------")

        # Update short term memory (conversation history) to full_text\
        # This is not optimal, but for this research prototype we are just using the first memory item
        # And the first memory item is the conversation history, so we are just updating that.
        if memory_store.memory.short_term:
            memory_store.update_memory_item_by_index(0, "SHORT_TERM", full_text)
        else:
            # Create a proper MemoryItem object
            memory_item = MemoryItem(
                id=f"memory_item_{uuid.uuid4().hex[:8]}",
                timestamps=Timestamps(
                    created=datetime.now().isoformat(),
                    updated=datetime.now().isoformat()
                ),
                type="SHORT_TERM",
                content=Content(
                    text=full_text,
                    embedding=None  # For this research prototype we are not leveraging the memory embeddings
                )
            )
            memory_store.add_memory_item(memory_item)

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