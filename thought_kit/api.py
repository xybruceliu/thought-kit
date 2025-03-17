"""
ThoughtKit API - Main interface for interacting with the ThoughtKit library.

This module provides a clean, simplified facade over the underlying implementation,
making it easier to generate, manipulate, and articulate thoughts.
"""

import json
from typing import Dict, List, Union, Any, Optional
from thought_kit.modules.ThoughtGenerator import ThoughtGenerator
from thought_kit.modules.ThoughtOperator import ThoughtOperator
from thought_kit.schemas import Thought, ThoughtSeed, ThoughtConfig, Event, Memory
from thought_kit.schemas.event_schema import SimpleEventInput
from thought_kit.utils import to_json, from_json


class ThoughtKitAPI:
    """
    Main interface for the ThoughtKit library.
    
    This class provides a simplified facade over the underlying implementation,
    handling JSON conversion and providing a consistent interface.

    All methods take JSON input and return JSON output by default (return_json_str=False for Dict output), 
    to enable easy integration with other systems.
    """
    
    def __init__(self):
        """Initialize the ThoughtKit API with its core components."""
        self.generator = ThoughtGenerator()
        self.operator = ThoughtOperator()
        # Register default operations for the operator
        self.operator.load_operations()
        print("🔧 Registered operations: ", self.operator.available_operations())
        print("💭 ThoughtKit API initialized.")
    
    async def generate(
        self, 
        input_data: Union[str, Dict[str, Any]],
        return_json_str: bool = True
    ) -> Union[Dict[str, Any], str, Thought]:
        """
        Generate a thought based on provided input data.
        
        Args:
            input_data: Either a JSON string or dictionary containing:
                - event: Information about the user's current interaction
                - seed: Configuration for generating the thought
                - config: Configuration for how the thought should behave
                - memory (optional): Memory context
                - thoughts (optional): Previous thoughts for context
            return_json_str: Whether to return JSON (True) or a Thought object (False)
            
        Returns:
            The generated thought as JSON string or Dict
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
        config_data = data.get("config", data.get("thought_config"))  # Support both for backward compatibility
        seed_data = data.get("seed", data.get("thought_seed"))  # Support both for backward compatibility
        
        # Validate required inputs
        if not event_data:
            raise ValueError("Event input is required")
        if not config_data:
            raise ValueError("Thought configuration is required")
        if not seed_data:
            raise ValueError("Thought seed is required")
            
        # Convert input components to model objects
        event_input = from_json(event_data, SimpleEventInput)
        config = from_json(config_data, ThoughtConfig)
        seed = from_json(seed_data, ThoughtSeed)
        
        # Process optional components
        memory = None
        if "memory" in data:
            memory = from_json(data["memory"], Memory)
            
        previous_thoughts = []
        if "thoughts" in data and data["thoughts"]:
            for thought_data in data["thoughts"]:
                previous_thoughts.append(from_json(thought_data, Thought))
        
        # Generate the thought using the generator
        thought = await self.generator.generate(
            event_input=event_input,
            seed=seed,
            config=config,
            memory=memory,
            previous_thoughts=previous_thoughts
        )
        
        # Return the thought in the requested format
        return to_json(thought, as_string=return_json_str)
        
          
    def operate(
        self, 
        input_data: Union[str, Dict[str, Any]],
        return_json_str: bool = True,
        **kwargs
    ) -> Union[Dict[str, Any], str, Thought, List[Thought]]:
        """
        Perform an operation on thoughts.
        
        Args:
            input_data: A JSON string or dictionary containing:
                - operation: Name of the operation to perform
                - thoughts: List of thoughts to operate on
                - memory (optional): Memory context
                - options (optional): Additional options for the operation
            return_json_str: Whether to return JSON (True) or Dict (False)
            **kwargs: Additional arguments to pass to the operation
            
        Returns:
            The modified thought(s) as JSON string or Dict
            
        Raises:
            ValueError: If the operation is not registered or required data is missing
        """
        # Process input data (JSON string or dictionary)
        if isinstance(input_data, str):
            try:
                data = json.loads(input_data)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON string provided")
        else:
            data = input_data
        
        # Extract and validate components
        operation = data.get("operation")
        if not operation:
            raise ValueError("Operation name is required in input_data")
            
        thoughts_data = data.get("thoughts")
        if not thoughts_data:
            raise ValueError("Thoughts are required in input_data")
            
        # Convert thoughts to Thought objects
        thoughts = []
        if isinstance(thoughts_data, list):
            for thought_data in thoughts_data:
                thoughts.append(from_json(thought_data, Thought))
            
        # Process optional components
        memory = None
        if "memory" in data:
            memory = from_json(data["memory"], Memory)
            
        # Extract options if provided
        options = data.get("options", {})
        
        # Merge options with kwargs
        operation_kwargs = {**options, **kwargs}
            
        # Run the operation on each thought
        updated_thoughts = self.operator.operate(operation, thoughts, memory=memory, **operation_kwargs)
            
        # Return the result in the requested format
        # Use the improved to_json function that can handle lists
        return to_json(updated_thoughts, as_string=return_json_str)
        

    def available_operations(self) -> List[str]:
        """
        Get a list of all available operations.
        
        Returns:
            List of operation names
        """
        return self.operator.available_operations()
       