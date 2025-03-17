"""
Operation for liking a thought by increasing its weight.
"""

from thought_kit.schemas import Thought, Memory
from typing import List, Optional

def like(thoughts: List[Thought], memory: Optional[Memory] = None, increment: float = 0.1, **options) -> List[Thought]:
    """
    Increase the weight of thoughts by a specified increment.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        increment: Amount to increase the weight by (default: 0.1)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with increased weights
    """
    for thought in thoughts:
        # Calculate new weight, ensuring it doesn't exceed 1.0
        new_weight = min(thought.config.weight + increment, 1.0)
        thought.config.weight = round(new_weight, 2)
        
    return thoughts

