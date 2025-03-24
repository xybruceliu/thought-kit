"""
Operation for pining a thought by setting its persistent property to true.
"""

from thought_kit.schemas import Thought, Memory
from typing import List, Optional

def pin(thoughts: List[Thought], memory: Optional[Memory] = None, **options) -> List[Thought]:
    """
    Pin thoughts by setting their persistent property to true.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with persistent set to true
    """
    for thought in thoughts:
        # Set persistent to true
        thought.config.persistent = True
        
    return thoughts


def unpin(thoughts: List[Thought], memory: Optional[Memory] = None, **options) -> List[Thought]:
    """
    Unpin thoughts by setting their persistent property to false.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with persistent set to false
    """
    for thought in thoughts:
        # Set persistent to false
        thought.config.persistent = False
        
    return thoughts