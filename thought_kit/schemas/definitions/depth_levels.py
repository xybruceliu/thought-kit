"""
Depth descriptions for thought depth.

This module provides mapping between integer scores (1-5) and 
depth descriptions for thoughts.
"""

from typing import Dict, Optional

# Mapping of depth levels to descriptions
DEPTH_LEVELS: Dict[int, str] = {
    1: "Very Superficially: Do not think deeply at all, just glance quickly or rely entirely on impressions or feelings.",
    2: "Somewhat Superficially: Consider a few aspects, but mostly rely on quick impressions or simple cues.",
    3: "Moderately: Give moderate thought to the content, considering both simple cues and some message details.",
    4: "Somewhat Deeply: Evaluate the message thoughtfully, analyzing arguments with considerable attention and cognitive effort.",
    5: "Very Deeply: Carefully and systematically analyze and scrutinize the content, paying close attention to argument quality and details."
}

def get_depth_description(level: int) -> Optional[str]:
    """
    Get the description for a given depth level.
    
    Args:
        level: Integer from 1-5 representing the depth level
        
    Returns:
        Description string or None if level is invalid
    """
    return DEPTH_LEVELS.get(level)