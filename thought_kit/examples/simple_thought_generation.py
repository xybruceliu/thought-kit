"""
Simple example of generating a thought using the ThoughtKit API.
"""

import asyncio
from thought_kit import api

async def main():
    # Create input data
    input_data = {
        "event": {
            "text": "I'm researching the impact of AI on society. I'm interested in the potential benefits and risks.",
            "type": "USER_INPUT",
            "duration": -1
        },
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant.",
                "user_prompt": "Genrate a thought that is an interpretation of the user's input."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "interpretation",
            "max_tokens": 100
        },
        "thought_config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 3,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        }
    }
    
    # Generate thought (returns JSON string)
    thought_json = await api.generate_thought(input_data)
    # print(f"Generated thought (JSON):\n{thought_json}\n")
    
    # Or get a Thought object
    thought = await api.generate_thought(input_data, return_json=False)
    print(f"💭 Thought content: {thought.content.text}")
    print(f"💭 Thought saliency: {thought.score.saliency}")

if __name__ == "__main__":
    asyncio.run(main()) 