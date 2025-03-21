"""
ThoughtKit API client for ThoughtfulLM backend.
This module provides a client for interacting with the ThoughtKit API.
"""

from typing import Dict, Any, List, Union, Optional
import asyncio
import os
import sys

# Add the ThoughtKit package to the Python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../../')))

# Import ThoughtKit API
from thought_kit import thoughtkit


class ThoughtKitClient:
    """
    Client for interacting with the ThoughtKit API.
    This class provides methods for generating thoughts, performing operations,
    and articulating thoughts.
    """
    
    def __init__(self):
        """Initialize the ThoughtKit client."""
        self.api = thoughtkit
        
    async def generate_thought(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate a thought using the ThoughtKit API.
        
        Args:
            data: Dictionary containing the thought generation parameters
            
        Returns:
            The generated thought as a dictionary
        """
        try:
            result = await self.api.generate(data, return_json_str=False)
            return result
        except Exception as e:
            raise Exception(f"Error generating thought: {str(e)}")
    
    def operate_on_thought(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Perform an operation on thoughts using the ThoughtKit API.
        
        Args:
            data: Dictionary containing the operation parameters
            
        Returns:
            The result of the operation as a dictionary
        """
        try:
            result = self.api.operate(data, return_json_str=False)
            return result
        except Exception as e:
            raise Exception(f"Error performing operation: {str(e)}")
    
    async def articulate_thoughts(self, data: Dict[str, Any]) -> str:
        """
        Articulate thoughts using the ThoughtKit API.
        
        Args:
            data: Dictionary containing the articulation parameters
            
        Returns:
            The articulated response as a string
        """
        try:
            result = await self.api.articulate(data)
            return result
        except Exception as e:
            raise Exception(f"Error articulating thoughts: {str(e)}")

# Create a singleton instance
thoughtkit_client = ThoughtKitClient() 