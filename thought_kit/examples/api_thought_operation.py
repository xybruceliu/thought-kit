"""
Example of thought operation using the ThoughtKit API.
"""

import asyncio
from thought_kit import thoughtkit

async def main():
    # Create event input data
    input_data = {
        "event": {
            "text": "Can you help me analyze the potential societal impacts of artificial general intelligence?",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        }
    }
    
    # Generate some thoughts
    thoughts = []
    for i in range(3):
        thought = await thoughtkit.generate({
            "event": input_data["event"],
            "seed": {
                "prompt": {
                    "system_prompt": "You are a thoughtful AI assistant.",
                    "user_prompt": f"Generate thought {i+1} about the user's query."
                },
                "model": "gpt-4o-mini",
                "temperature": 0.7,
                "type": "analytical",
                "max_tokens": 50
            },
            "config": {
                "modality": "TEXT",
                "depth": i+1,  # Varying depth levels
                "length": 5,
                "interactivity": "VIEW",
                "persistent": False,
                "weight": 0.7
            }
        })
        thoughts.append(thought)
        print(f"Generated thought {i+1}: {thought['content']['text']}")
    
    # Perform an operation (grouping)
    operation_data = {
        "operation": "group",
        "thoughts": thoughts,
        "options": {
            "criterion": "semantic_similarity",
            "threshold": 0.5
        }
    }
    
    result = await thoughtkit.operate(operation_data)
    print("\nOperation result:")
    print(result)
    
if __name__ == "__main__":
    asyncio.run(main())
