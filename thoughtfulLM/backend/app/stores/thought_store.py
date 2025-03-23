"""
ThoughtStore module for ThoughtfulLM backend.
This module provides a simple in-memory store for thoughts.
"""

from typing import Dict, List, Optional, Union, Literal
import uuid
from datetime import datetime
import asyncio

# Import schemas from thought_kit
from thought_kit.schemas.thought_schema import Thought

# Define event types
EventTypes = Literal["CLICK", "IDLE_TIME", "WORD_COUNT_CHANGE", "SENTENCE_END", "NAMED_ENTITY"]

class ThoughtStore:
    """
    A simple in-memory store for thoughts.
    This class provides methods for storing, retrieving, and managing thoughts.
    """
    
    def __init__(self):
        """Initialize the thought store with an empty dictionary."""
        self.thoughts: Dict[str, Thought] = {}
        self.max_thought_count: int = 5
    
    def add_thought(self, thought: Thought) -> Thought:
        """
        Add a thought to the store.
        
        Args:
            thought: The thought to add
            
        Returns:
            The added thought
        """
        # Store the thought in the dictionary
        self.thoughts[thought.id] = thought
        
        # If we have too many thoughts, remove the least salient one
        if len(self.thoughts) > self.max_thought_count:
            self._prune_least_salient_thought()
            
        return thought
    
    def get_thought(self, thought_id: str) -> Optional[Thought]:
        """
        Get a thought from the store by ID.
        
        Args:
            thought_id: The ID of the thought to get
            
        Returns:
            The thought if found, None otherwise
        """
        return self.thoughts.get(thought_id)
    
    def get_all_thoughts(self) -> List[Thought]:
        """
        Get all thoughts from the store.
        
        Returns:
            A list of all thoughts
        """
        return list(self.thoughts.values())
    
    def update_thought(self, thought_id: str, new_thought: Thought) -> Optional[Thought]:
        """
        Update a thought in the store.
        
        Args:
            thought_id: The ID of the thought to update
            new_thought: The new thought to replace the old one
            
        Returns:
            The updated thought if found, None otherwise
        """
        thought = self.get_thought(thought_id)
        if not thought:
            return None
        
        # Update the thought
        thought = new_thought

        # Store the updated thought
        self.thoughts[thought_id] = thought
        return thought
    
    def remove_thought(self, thought_id: str) -> bool:
        """
        Remove a thought from the store.
        
        Args:
            thought_id: The ID of the thought to remove
            
        Returns:
            True if the thought was removed, False otherwise
        """
        if thought_id in self.thoughts:
            del self.thoughts[thought_id]
            return True
        return False
    
    def clear(self) -> None:
        """Clear all thoughts from the store."""
        self.thoughts.clear()

# Create a singleton instance
thought_store = ThoughtStore() 