"""
Example demonstrating how to create schemas using the simple_json_to_x functions.

This shows how to easily create Thoughts, Memories, and UserEvents without 
dealing with the complexity of the full schema.

Make sure to set the OPENAI_API_KEY environment variable before running this script,
or set compute_embedding=False to disable embedding computation.
"""

import json
from thought_kit import (
    simple_json_to_thought,
    simple_json_to_memory,
    simple_json_to_user_event,
    thought_to_json,
    memory_to_json,
    user_event_to_json
)


def create_simple_thought():
    """Create a thought using the simple input schema."""
    # Simple thought input as a dictionary
    simple_thought = {
        "text": "Climate change is accelerating faster than previously predicted",
        "modality": "TEXT",
        "interactivity": "COMMENT",
        "weight": 0.8
    }
    
    # Create a full Thought object from the simple input
    # Set compute_embedding=False to disable embedding computation
    thought = simple_json_to_thought(simple_thought, compute_embedding=False)
    
    # Print the full thought object as JSON
    print("\n--- Thought from simple input (dictionary) ---")
    print(thought_to_json(thought, as_string=False))
    
    return thought


def create_simple_thought_json_string():
    """Create a thought using the simple input schema from a JSON string."""
    # Simple thought input as a JSON string
    simple_thought = """
    {
        "text": "Climate change is accelerating faster than previously predicted",
        "modality": "TEXT",
        "interactivity": "COMMENT",
        "weight": 0.8   
    }
    """
    
    # Create a full Thought object from the simple input
    # Set compute_embedding=False to disable embedding computation
    thought = simple_json_to_thought(simple_thought, compute_embedding=False)   

    # Print the full thought object as JSON
    print("\n--- Thought from simple input (JSON string) ---")
    print(thought_to_json(thought))
    
    return thought


def create_simple_memory():
    """Create a memory using the simple input schema."""
    # Simple memory input as a dictionary
    simple_memory = {
        "long_term": "The user is interested in climate change data. They are working on a research paper. They are also interested in the impact of climate change on agriculture.",
        "short_term": "The user just asked about the impact of climate change on agriculture. They mentioned they are working on a research paper."
    }
    
    # Create a full Memory object from the simple input
    # Set compute_embedding=False to disable embedding computation
    memory = simple_json_to_memory(simple_memory, compute_embedding=False)
    
    # Print the full memory object as JSON
    print("\n--- Memory from simple input ---")
    print(memory_to_json(memory))
    
    return memory


def create_simple_user_event():
    """Create a user event using the simple input schema."""
    # Simple user event input as a dictionary
    simple_event = {
        "text": "User asked about global warming trends",
        "type": "NEW_INPUT",
        "duration": 2.5
    }
    
    # Create a full UserEvent object from the simple input
    # Set compute_embedding=False to disable embedding computation
    event = simple_json_to_user_event(simple_event, compute_embedding=False)
    
    # Print the full user event object as JSON
    print("\n--- UserEvent from simple input ---")
    print(user_event_to_json(event))
    
    return event


def main():
    """Run all examples."""
    print("===== ThoughtKit Simple Schema Examples =====")
    create_simple_thought()
    create_simple_thought_json_string()
    create_simple_memory()
    create_simple_user_event()


if __name__ == "__main__":
    main() 