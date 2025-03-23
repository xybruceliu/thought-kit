"""
MemoryStore module for ThoughtfulLM backend.
This module provides a simple in-memory store for memories.
"""

from typing import Dict, List, Optional, Union, Literal
import uuid
from datetime import datetime
import asyncio

# Import schemas from thought_kit
from thought_kit.schemas.memory_schema import Memory, MemoryItem, SimpleMemoryInput, create_memory_from_simple_input

class MemoryStore:
    """
    A simple in-memory store for memories.
    This class provides methods for storing, retrieving, and managing memories.
    """
    
    def __init__(self):
        """Initialize the memory store with empty memory structure."""
        self.memory = Memory(long_term=[], short_term=[])
        self.max_short_term_count: int = 10
        self.max_long_term_count: int = 20
    
    def add_memory_item(self, memory_item: MemoryItem) -> MemoryItem:
        """
        Add a memory item to the store.
        
        Args:
            memory_item: The memory item to add
            
        Returns:
            The added memory item
        """
        # Determine which memory type to add to
        if memory_item.type == "SHORT_TERM":
            self.memory.short_term.append(memory_item)
                
        elif memory_item.type == "LONG_TERM":
            self.memory.long_term.append(memory_item)
            
        return memory_item
    
    async def add_simple_memory(self, input_data: SimpleMemoryInput, compute_embedding: bool = True) -> Memory:
        """
        Create and add memory items from simple input.
        
        Args:
            input_data: The simple memory input data
            compute_embedding: Whether to compute embeddings for memory items
            
        Returns:
            The updated Memory object
        """
        # Create memory items from simple input
        new_memory = await create_memory_from_simple_input(input_data, compute_embedding)
        
        # Add each long-term memory item
        for item in new_memory.long_term:
            self.add_memory_item(item)
            
        # Add each short-term memory item
        for item in new_memory.short_term:
            self.add_memory_item(item)
            
        return self.memory
    
    def get_memory_item(self, memory_id: str) -> Optional[MemoryItem]:
        """
        Get a memory item from the store by ID.
        
        Args:
            memory_id: The ID of the memory item to get
            
        Returns:
            The memory item if found, None otherwise
        """
        # Search in long-term memory
        for item in self.memory.long_term:
            if item.id == memory_id:
                return item
        
        # Search in short-term memory
        for item in self.memory.short_term:
            if item.id == memory_id:
                return item
                
        return None
    
    def get_all_memory(self) -> Memory:
        """
        Get all memories from the store.
        
        Returns:
            The Memory object containing all memory items
        """
        return self.memory
    
    def get_long_term_memory(self) -> List[MemoryItem]:
        """
        Get all long-term memory items.
        
        Returns:
            A list of long-term memory items
        """
        return self.memory.long_term
    
    def get_short_term_memory(self) -> List[MemoryItem]:
        """
        Get all short-term memory items.
        
        Returns:
            A list of short-term memory items
        """
        return self.memory.short_term
    
    def update_memory_item(self, memory_id: str, updated_item: MemoryItem) -> Optional[MemoryItem]:
        """
        Update a memory item in the store.
        
        Args:
            memory_id: The ID of the memory item to update
            updated_item: The updated memory item
            
        Returns:
            The updated memory item if found, None otherwise
        """
        # Search and update in long-term memory
        for i, item in enumerate(self.memory.long_term):
            if item.id == memory_id:
                self.memory.long_term[i] = updated_item
                return updated_item
        
        # Search and update in short-term memory
        for i, item in enumerate(self.memory.short_term):
            if item.id == memory_id:
                self.memory.short_term[i] = updated_item
                return updated_item
                
        return None
    
    def remove_memory_item(self, memory_id: str) -> bool:
        """
        Remove a memory item from the store.
        
        Args:
            memory_id: The ID of the memory item to remove
            
        Returns:
            True if the memory item was removed, False otherwise
        """
        # Search and remove from long-term memory
        for i, item in enumerate(self.memory.long_term):
            if item.id == memory_id:
                self.memory.long_term.pop(i)
                return True
        
        # Search and remove from short-term memory
        for i, item in enumerate(self.memory.short_term):
            if item.id == memory_id:
                self.memory.short_term.pop(i)
                return True
                
        return False
    
    def clear(self) -> None:
        """Clear all memories from the store."""
        self.memory = Memory(long_term=[], short_term=[])
    
    def clear_short_term(self) -> None:
        """Clear only short-term memories from the store."""
        self.memory.short_term = []

# Create a singleton instance
memory_store = MemoryStore() 