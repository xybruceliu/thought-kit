from fastapi import APIRouter, HTTPException, status, Body
from app.models.thought_models import GenerationRequest, OperationRequest, ArticulationRequest, ThoughtUpdateRequest
from app.utils.similarity import cosine_similarity
from thought_kit import thoughtkit
import random
import re
from thought_kit.schemas.memory_schema import MemoryItem, Memory
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
                and thoughts/memory from the frontend
    
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
                "length": 3,
                "interactivity": "EDIT",
                "persistent": False,
                "weight": 0 # weight are initialized to 0, this is a parameter that can be changed by the user.
            },
            "memory": request.memory or {"long_term": [], "short_term": []},
            "thoughts": request.thoughts or []
        }

        # Create a clean copy of input_data for logging
        log_input_data = {
            "event": input_data["event"],
            "seed": input_data["seed"]["type"] if "type" in input_data["seed"] else "loaded_seed",
            "config": input_data["config"],
            "memory": request.memory.short_term[0].content.text if request.memory.short_term else "No short term memory yet",
            "thoughts": f"[{len(request.thoughts or [])} thoughts from frontend]"
        }
        print("--------------------------------")
        print("🤔 New Thought Generation Request:")
        print(log_input_data)
        print("--------------------------------")

        # Use the single parameter format
        result = await thoughtkit.generate(input_data, return_json_str=False, return_model=True)

        # If saliency is less than 0.6 return None
        if result.score.saliency < 0.6:
            print("❌ No thought generated, saliency is less than 0.6")
            return None

        # Check if the thought is similar to one of the existing thoughts
        similar_thought_found = False
        updated_thought = None
        
        for thought in request.thoughts or []:
            if result.content.embedding and thought.content and thought.content.embedding:
                if cosine_similarity(result.content.embedding, thought.content.embedding) > 0.8:
                    # Create a copy with updated saliency
                    updated_thought = thought.model_copy()
                    # Increase saliency by 0.2, but make sure weight + saliency doesn't exceed 2.0
                    updated_thought.score.saliency = min(updated_thought.score.saliency + 0.2, 2.0 - updated_thought.score.weight)
                    similar_thought_found = True
                    break  # Exit loop once we find a similar thought

        if similar_thought_found and updated_thought:
            # Return the updated thought directly
            print("--------------------------------")
            print("🫵 Similar Thought Found - Returning Updated Thought:")
            print(f"ID: {updated_thought.id}, Saliency: {updated_thought.score.saliency}")
            print("--------------------------------")
            return updated_thought

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
        
        # Return the result without storing it
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

@router.put("/{thought_id}", status_code=status.HTTP_200_OK)
async def update_thought(thought_id: str, update_request: ThoughtUpdateRequest):
    """
    Apply updates to a thought and return the updated version.
    
    Args:
        thought_id: The ID of the thought to update
        update_request: The request containing the properties to update
    
    Returns:
        The updated thought
    """
    try:
        # The frontend needs to send the entire thought to update in the request body
        if not update_request.thought:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Thought to update must be provided in the request"
            )
        
        # Check if thought ID matches
        if update_request.thought.id != thought_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Thought ID in path ({thought_id}) doesn't match thought ID in body ({update_request.thought.id})"
            )
        
        # Create a copy of the thought to update
        thought = update_request.thought.model_copy()
        
        # Update score properties if provided
        if update_request.weight is not None:
            # Ensure weight is between 0 and 1
            thought.score.weight = update_request.weight
        
        if update_request.saliency is not None:
            # Ensure saliency is between 0 and 1
            thought.score.saliency = update_request.saliency
        
        # Update config properties if provided
        if update_request.persistent is not None:
            thought.config.persistent = update_request.persistent
        
        if update_request.interactivity is not None:
            thought.config.interactivity = update_request.interactivity
        
        # Update content text if provided
        if update_request.content_text is not None:
            thought.content.text = update_request.content_text
        
        # Add user comment if provided
        if update_request.add_user_comment:
            thought.user_comments.append(update_request.add_user_comment)
        
        # Update timestamp
        thought.timestamps.updated = datetime.now().isoformat()
        
        return thought
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to update thought: {str(e)}"
        ) 