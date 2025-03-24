"""
Operation for liking a thought by increasing its weight.
"""

from thought_kit.schemas import Thought, Memory
from typing import List, Optional

def like(thoughts: List[Thought], memory: Optional[Memory] = None, amount: float = 0.1, **options) -> List[Thought]:
    """
    Increase the weight of thoughts by a specified amount.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        amount: Amount to increase the weight by (default: 0.1)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with increased weights
    """
    for thought in thoughts:
        # Interaction level must be COMMENT or EDIT, not VIEW
        if thought.config.interactivity == "VIEW":
            continue

        # Make sure weight + saliency doesn't exceed 2.0
        new_weight = min(thought.score.weight + amount, 2.0 - thought.score.saliency)
        thought.score.weight = round(new_weight, 2)
        
    return thoughts


def dislike(thoughts: List[Thought], memory: Optional[Memory] = None, amount: float = 0.1, **options) -> List[Thought]:
    """
    Decrease the weight of thoughts by a specified amount.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        amount: Amount to decrease the weight by (default: 0.1)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with decreased weights
    """ 

    for thought in thoughts:
        # Interaction level must be COMMENT or EDIT, not VIEW
        if thought.config.interactivity == "VIEW":
            continue

        # Calculate new weight, ensuring it doesn't fall below 0.0
        new_weight = max(thought.score.weight - amount, 0.0)
        thought.score.weight = round(new_weight, 2)

    return thoughts 


