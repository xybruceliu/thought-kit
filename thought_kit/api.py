"""
ThoughtKit API - Main interface for interacting with the ThoughtKit library.

This module provides a clean, simplified facade over the underlying implementation,
making it easier to generate, manipulate, and articulate thoughts.
"""

import json
from typing import Dict, List, Union, Any, Optional
from thought_kit.modules.ThoughtGenerator import ThoughtGenerator
from thought_kit.schemas import Thought, ThoughtSeed, ThoughtConfig, Event, Memory
from thought_kit.schemas.event_schema import SimpleEventInput
from thought_kit.utils import to_json, from_json


class ThoughtKit:
    """
    Main interface for the ThoughtKit library.
    
    This class provides a simplified facade over the underlying implementation,
    handling JSON conversion and providing a consistent interface.
    """
    
    def __init__(self):
        """Initialize the ThoughtKit API with its core components."""
        self.generator = ThoughtGenerator()
    
    async def generate_thought(
        self, 
        input_data: Union[str, Dict[str, Any]],
        return_json: bool = True
    ) -> Union[Dict[str, Any], str, Thought]:
        """
        Generate a thought based on provided input data.
        
        Args:
            input_data: Either a JSON string or dictionary containing:
                - event: Information about the user's current interaction
                - thought_seed: Configuration for generating the thought
                - thought_config: Configuration for how the thought should behave
                - memory (optional): Memory context
                - thoughts (optional): Previous thoughts for context
            return_json: Whether to return JSON (True) or a Thought object (False)
            
        Returns:
            The generated thought as JSON string, dict, or Thought object
        """
        # Process input data
        if isinstance(input_data, str):
            try:
                data = json.loads(input_data)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string provided")
        else:
            data = input_data
            
        # Extract and validate components
        event_data = data.get("event")
        thought_config_data = data.get("thought_config")
        thought_seed_data = data.get("thought_seed")
        
        # Validate required inputs
        if not event_data:
            raise ValueError("Event input is required")
        if not thought_config_data:
            raise ValueError("Thought configuration is required")
        if not thought_seed_data:
            raise ValueError("Thought seed is required")
            
        # Convert input components to model objects
        event_input = from_json(event_data, SimpleEventInput)
        thought_config = from_json(thought_config_data, ThoughtConfig)
        thought_seed = from_json(thought_seed_data, ThoughtSeed)
        
        # Process optional components
        memory = None
        if "memory" in data:
            memory = from_json(data["memory"], Memory)
            
        previous_thoughts = []
        if "thoughts" in data and data["thoughts"]:
            for thought_data in data["thoughts"]:
                previous_thoughts.append(from_json(thought_data, Thought))
        
        # Generate the thought using the generator
        thought = await self.generator.generate_thought(
            event_input=event_input,
            thought_seed=thought_seed,
            thought_config=thought_config,
            memory=memory,
            previous_thoughts=previous_thoughts
        )
        
        # Return the thought in the requested format
        if return_json:
            if isinstance(return_json, bool):
                # Return JSON string
                return to_json(thought)
            else:
                # Return JSON dict
                return to_json(thought, as_string=False)
        
        # Return Thought object
        return thought
       