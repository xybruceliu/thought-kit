"""
Operation for reacting to a thought by adding a emoji and increasing its weight.
"""

from thought_kit.schemas import Thought, Memory
from typing import List, Optional

def react(thoughts: List[Thought], memory: Optional[Memory] = None, reaction: str = "", amount: float = 0.1, **options) -> List[Thought]:
    """
    React to thoughts by adding an emoji and increasing their weight.
    
    Args:
        thoughts: List of thoughts to operate on
        memory: Optional memory context (not used in this operation)
        reaction: User's reaction text, emoji, or other content to add as a emoji
        amount: Amount to increase the weight by (default: 0.1)
        **options: Additional options (not used)
        
    Returns:
        The updated list of thoughts with added emoji and increased weights
    """
    if not reaction:
        # If no reaction provided, just return the thoughts unchanged
        return thoughts
    
    for thought in thoughts:
        # Interaction level must be COMMENT or EDIT, not VIEW
        if thought.config.interactivity == "VIEW":
            continue
            
        # Add the reaction to user_comments
        if not hasattr(thought, "user_comments") or thought.user_comments is None:
            thought.user_comments = []
            
        # Simply append the reaction text directly
        thought.user_comments.append(reaction)
        
        # Increase weight to indicate user attention
        new_weight = min(thought.score.weight + amount, 1.0)
        thought.score.weight = round(new_weight, 2)
        
    return thoughts 