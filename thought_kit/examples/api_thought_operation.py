"""
Simple example of operating on a thought using the ThoughtKit API.
"""

import asyncio
from thought_kit import thoughtkit

async def main():
    # First, create a simple thought using the API
    thought_input = {
        "event": {
            "text": "User is discussing AI ethics.",
            "type": "IDLE_TIME",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are an AI assistant.",
                "user_prompt": "Generate a thought about AI ethics."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
        },
        "config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 10,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.5
        }
    }
    
    # Generate a thought using the API
    thought = await thoughtkit.generate(thought_input, return_json_str=False)
    
    print(f"Original thought: {thought['content']['text']}")
    print(f"Original weight: {thought['score']['weight']}")
    
    # Create input data for the operation
    operation_input = {
        "operation": "like",
        "thoughts": [thought],
        "options": {
            "amount": 0.2  # Increase weight by 0.2 instead of default 0.1
        }
    }
    
    # Perform the operation (returns JSON by default)
    result_json = thoughtkit.operate(operation_input)
    print(f"Operation result (JSON): {result_json[:50]}...")
    
    # Or get the result as a Python object
    result = thoughtkit.operate(operation_input, return_json_str=False)
    
    # Since result is a list (even for a single thought), get the first item
    updated_thought = result[0]
    print(f"Updated thought: {updated_thought['content']['text']}")
    print(f"Updated weight: {updated_thought['score']['weight']}")
    
    # Demonstrate multiple operations
    # Let's like it again with the default amount (0.1)
    operation_input = {
        "operation": "dislike",
        "thoughts": [updated_thought],
        # No options specified, will use default amount of 0.1
    }
    
    result = thoughtkit.operate(operation_input, return_json_str=False)
    final_thought = result[0]
    
    print(f"Final weight after second like: {final_thought['score']['weight']}")
    
    # Demonstrate weight capping at 1.0
    # Let's try to increase it by a large amount
    operation_input = {
        "operation": "like",
        "thoughts": [final_thought],
        "options": {
            "amount": 0.5  # Try to increase by 0.5
        }
    }
    
    result = thoughtkit.operate(operation_input, return_json_str=False)
    capped_thought = result[0]
    
    print(f"Weight after attempting large amount: {capped_thought['score']['weight']}")

if __name__ == "__main__":
    asyncio.run(main())