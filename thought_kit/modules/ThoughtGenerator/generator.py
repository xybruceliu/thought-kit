"""
Thought Generator module for generating AI thoughts based on various inputs.
"""

import json
import uuid
from datetime import datetime
from typing import Dict, List, Union, Optional, Any
from pydantic import ValidationError

from thought_kit.schemas import (
    Thought,
    ThoughtSeed,
    SimpleUserEventInput,
    Memory,
    UserEvent,
    create_user_event_from_simple_input,
    create_thought_from_simple_input,
    json_to_thought
)
from thought_kit.utils import get_completion, get_embedding_sync

class ThoughtGenerator:
    """
    Generator class for creating AI thoughts based on various inputs.
    """
    
    def __init__(self):
        """Initialize the ThoughtGenerator."""
        pass
        
    def generate_thought(
        self,
        input_data: Union[str, Dict[str, Any]],
    ) -> Thought:
        """
        Generate a thought based on the provided input data.
        
        Args:
            input_data: JSON string or dictionary containing:
                - memory (optional): Memory object or dictionary
                - thoughts (optional): List of previous thoughts
                - user_event: Simple user event input
                - thought_config: Configuration for thought generation
                - thought_seed: Seed data for thought generation
                
        Returns:
            Thought: The generated thought object
            
        Raises:
            ValueError: If required data is missing or invalid
            ValidationError: If data validation fails
        """
        # Process input data
        if isinstance(input_data, str):
            try:
                data = json.loads(input_data)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string provided")
        else:
            data = input_data
            
        # Extract components
        memory = data.get("memory")
        thoughts = data.get("thoughts", [])
        user_event_input = data.get("user_event")
        thought_config = data.get("thought_config")
        thought_seed = data.get("thought_seed")
        
        # Validate required inputs
        if not user_event_input:
            raise ValueError("⛔️ User event input is required")
        if not thought_config:
            raise ValueError("⛔️ Thought configuration is required")
        if not thought_seed:
            raise ValueError("⛔️ Thought seed is required")
            
        # Process user event
        try:
            user_event = create_user_event_from_simple_input(user_event_input)
        except ValidationError as e:
            raise ValueError(f"⛔️ Invalid user event input: {str(e)}")
            
        # Process thought seed
        if not isinstance(thought_seed, ThoughtSeed):
            try:
                # Attempt to convert dictionary to ThoughtSeed if needed
                if isinstance(thought_seed, dict):
                    seed_dict = thought_seed
                else:
                    seed_dict = json.loads(thought_seed) if isinstance(thought_seed, str) else {}
                thought_seed = ThoughtSeed(**seed_dict)
            except (ValidationError, json.JSONDecodeError) as e:
                raise ValueError(f"⛔️ Invalid thought seed: {str(e)}")
                
        # Process memory if provided
        memory_obj = None
        if memory:
            if not isinstance(memory, Memory):
                try:
                    # Attempt to convert dictionary to Memory if needed
                    if isinstance(memory, dict):
                        memory_dict = memory
                    else:
                        memory_dict = json.loads(memory) if isinstance(memory, str) else {}
                    memory_obj = Memory(**memory_dict)
                except (ValidationError, json.JSONDecodeError) as e:
                    raise ValueError(f"⛔️ Invalid memory: {str(e)}")
            else:
                memory_obj = memory
        
        # Process previous thoughts if provided
        # If not a thought schema, check if it's a simple thought input and try to convert it
        thought_list = []
        for thought in thoughts:
            if not isinstance(thought, Thought):
                try:
                    # Attempt to convert dictionary to Thought if needed
                    if isinstance(thought, dict):
                        thought_dict = thought
                    else:
                        thought_dict = json.loads(thought) if isinstance(thought, str) else {}
                    thought_obj = create_thought_from_simple_input(thought_dict)
                    thought_list.append(thought_obj)
                except (ValidationError, json.JSONDecodeError) as e:
                    raise ValueError(f"⛔️ Invalid thought in list: {str(e)}")
            else:
                thought_list.append(thought)
        
        # Generate prompt for the LLM based on the inputs
        prompt = self._build_generation_prompt(
            user_event=user_event,
            thought_seed=thought_seed,
            memory=memory_obj,
            thoughts=thought_list,
            config=thought_config
        )
        
        # Get completion from LLM
        response = get_completion(
            messages=[{"role": "system", "content": prompt}],
            model=thought_seed.model,
            temperature=thought_seed.temperature,
            max_tokens=thought_seed.max_tokens
        )
        
        # Process LLM response into a Thought object with full details
        try:
            # Generate embedding for the response text
            embedding = get_embedding_sync(response) if response.strip() else None
            
            # Create a complete thought structure with all fields explicitly defined
            thought_data = {
                "id": f"thought_{uuid.uuid4().hex[:8]}",
                "timestamps": {
                    "created": datetime.now().isoformat(),
                    "updated": datetime.now().isoformat()
                },
                "content": {
                    "text": response,
                    "embedding": embedding
                },
                "config": {
                    "modality": thought_config.get("modality", "TEXT"),
                    "depth": thought_config.get("depth", 3),
                    "interactivity": thought_config.get("interactivity", "VIEW"),
                    "persistent": thought_config.get("persistent", False)
                },
                "seed": thought_seed.model_dump() if thought_seed else None,
                "trigger_event": user_event.model_dump() if user_event else None,
                "references": [memory_obj.id] if memory_obj else [],
                "user_comments": [],
                "score": {
                    "weight": thought_config.get("weight", 0.5),
                    "saliency": thought_config.get("saliency", 0.0)
                }
            }
            
            # If there are previous thoughts, add their IDs to references
            if thought_list and len(thought_list) > 0:
                thought_data["references"].extend([t.id for t in thought_list])
            
            # Create the thought using the detailed JSON structure
            generated_thought = json_to_thought(thought_data)
            
            return generated_thought
            
        except Exception as e:
            raise ValueError(f"⛔️ Failed to create thought from LLM response: {str(e)}")
    
    def _build_generation_prompt(
        self,
        user_event: UserEvent,
        thought_seed: ThoughtSeed,
        memory: Optional[Memory] = None,
        thoughts: Optional[List[Thought]] = None,
        config: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Build a prompt for the LLM to generate a thought.
        
        Args:
            user_event: User event that triggered the thought generation
            thought_seed: Seed data for thought generation
            memory: Optional memory object for context
            thoughts: Optional list of previous thoughts for context
            config: Additional configuration parameters
            
        Returns:
            str: The constructed prompt for the LLM
        """
        # Default config if none provided
        config = config or {}
        
        # Get modality and interactivity from config
        modality = config.get("modality", "TEXT")
        interactivity = config.get("interactivity", "VIEW")
        weight = config.get("weight", 0.5)
        
        # Base prompt template
        prompt = f"""
        You are generating an AI thought in response to a user event.
        
        # THOUGHT SEED
        Type: {thought_seed.type}
        Model: {thought_seed.model}
        Temperature: {thought_seed.temperature}
        Max Tokens: {thought_seed.max_tokens}
        
        # THOUGHT CONFIG
        Modality: {modality}
        Interactivity: {interactivity}
        Weight: {weight}
        
        # USER EVENT
        Type: {user_event.event_type}
        Content: {user_event.content}
        Timestamp: {user_event.timestamp}
        """
        
        # Add memory context if available
        if memory:
            prompt += f"""
            # MEMORY CONTEXT
            Title: {memory.title}
            Content: {memory.content}
            Created: {memory.created_at}
            Updated: {memory.updated_at}
            """
        
        # Add previous thoughts if available
        if thoughts and len(thoughts) > 0:
            prompt += "\n# PREVIOUS THOUGHTS\n"
            for i, thought in enumerate(thoughts):
                prompt += f"""
                Thought {i+1}:
                Content: {thought.content}
                Modality: {thought.modality}
                Interactivity: {thought.interactivity}
                Weight: {thought.weight}
                Created: {thought.created_at}
                """
        
        # Add instructions based on modality and interactivity
        prompt += f"""
        # INSTRUCTIONS
        Generate a thoughtful response in the {modality} modality.
        The thought should be {interactivity.lower()} in nature.
        Keep the response concise but insightful.
        Do not include any preamble or explanations - only provide the thought content.
        """
        
        # Add any custom instructions from config
        if "custom_instructions" in config:
            prompt += f"\n{config['custom_instructions']}\n"
        
        return prompt
