"""
ThoughtKit presets module.
This module provides access to predefined configurations and resources.
"""

import os
import json
from typing import Dict, Any, List, Optional

# Path to the thought seeds directory
THOUGHT_SEEDS_DIR = os.path.join(os.path.dirname(__file__), 'thought_seeds')

def get_available_thought_seeds() -> List[str]:
    """
    Get a list of available predefined thought seeds.
    
    Returns:
        List of thought seed names (without .json extension)
    """
    if not os.path.exists(THOUGHT_SEEDS_DIR):
        return []
        
    seed_files = [f for f in os.listdir(THOUGHT_SEEDS_DIR) 
                 if f.endswith('.json') and os.path.isfile(os.path.join(THOUGHT_SEEDS_DIR, f))]
    
    return [os.path.splitext(f)[0] for f in seed_files]

def load_thought_seed(name: str) -> Optional[Dict[str, Any]]:
    """
    Load a predefined thought seed by name.
    
    Args:
        name: Name of the thought seed (without .json extension)
        
    Returns:
        Thought seed configuration as a dictionary, or None if not found
        
    Example:
        reflective_seed = load_thought_seed("reflective")
    """
    seed_path = os.path.join(THOUGHT_SEEDS_DIR, f"{name}.json")
    
    if not os.path.exists(seed_path):
        available = get_available_thought_seeds()
        if available:
            available_str = ", ".join(available)
            print(f"Thought seed '{name}' not found. Available seeds: {available_str}")
        else:
            print(f"Thought seed '{name}' not found. No presets available.")
        return None
    
    try:
        with open(seed_path, 'r') as f:
            return json.load(f)
    except Exception as e:
        print(f"Error loading thought seed '{name}': {str(e)}")
        return None

def save_thought_seed(name: str, seed_data: Dict[str, Any]) -> bool:
    """
    Save a thought seed configuration to create a new preset.
    
    Args:
        name: Name for the thought seed (without .json extension)
        seed_data: Thought seed configuration as a dictionary
        
    Returns:
        True if successful, False otherwise
        
    Example:
        save_thought_seed("my_custom_seed", {
            "prompt": {
                "system_prompt": "Custom system prompt",
                "user_prompt": "Custom user prompt"
            },
            "model": "gpt-4o",
            "temperature": 0.5,
            "type": "custom",
            "max_tokens": 100
        })
    """
    # Create directory if it doesn't exist
    os.makedirs(THOUGHT_SEEDS_DIR, exist_ok=True)
    
    seed_path = os.path.join(THOUGHT_SEEDS_DIR, f"{name}.json")
    
    try:
        with open(seed_path, 'w') as f:
            json.dump(seed_data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving thought seed '{name}': {str(e)}")
        return False 