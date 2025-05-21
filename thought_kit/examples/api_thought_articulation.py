"""
Simple example of articulating thoughts using the ThoughtKit API.
"""

import asyncio
from thought_kit import thoughtkit

async def main():
    # First, create a few thoughts using the API
    thought1_input = {
        "event": {
            "text": "Tell me about the importance of exercise.",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are an AI assistant.",
                "user_prompt": "Generate a thought about the importance of regular exercise for physical health."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 50
        },
        "config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 15,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.9
        }
    }
    
    thought2_input = {
        "event": {
            "text": "Tell me about the importance of exercise.",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are an AI assistant.",
                "user_prompt": "Generate a thought about the mental health benefits of exercise."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 50
        },
        "config": {
            "modality": "TEXT",
            "depth": 4,
            "length": 15,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.7
        }
    }
    
    thought3_input = {
        "event": {
            "text": "Tell me about the importance of exercise.",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are an AI assistant.",
                "user_prompt": "Generate a thought about practical ways to incorporate exercise into daily routines."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 50
        },
        "config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 15,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.5
        }
    }
    
    # Generate thoughts
    print("Generating thoughts...")
    thought1 = await thoughtkit.generate(thought1_input, return_json_str=False)
    thought2 = await thoughtkit.generate(thought2_input, return_json_str=False)
    thought3 = await thoughtkit.generate(thought3_input, return_json_str=False)
    
    print("\nGenerated Thoughts:")
    print(f"Thought 1 [Saliency: {thought1['score']['saliency']:.2f}]: {thought1['content']['text']}")
    print(f"Thought 2 [Saliency: {thought2['score']['saliency']:.2f}]: {thought2['content']['text']}")
    print(f"Thought 3 [Saliency: {thought3['score']['saliency']:.2f}]: {thought3['content']['text']}")
    
    # Set up memory for context (optional)
    memory = {
        "long_term": [
            {
                "id": "memory_12345",
                "timestamp": {
                    "created": "2023-10-15T14:30:00",
                    "updated": "2023-10-15T14:30:00"
                },
                "type": "LONG_TERM",
                "content": {
                    "text": "The user is interested in fitness and health topics.",
                    "embedding": []
                }
            }
        ],
        "short_term": [
            {
                "id": "memory_67890",
                "timestamp": {
                    "created": "2023-10-15T14:35:00",
                    "updated": "2023-10-15T14:35:00"
                },
                "type": "SHORT_TERM",
                "content": {
                    "text": "User just asked about the importance of exercise.",
                    "embedding": []
                }
            }
        ]
    }
    
    # Create input data for articulation
    articulation_input = {
        "thoughts": [thought1, thought2, thought3],
        "memory": memory,
        "model": "gpt-4o",
        "temperature": 0.7,
        "max_tokens": 500
    }
    
    # Articulate the thoughts into a response
    print("\nArticulating thoughts into a response...")
    response = await thoughtkit.articulate(articulation_input)
    
    print("\nArticulated Response:")
    print(response)

if __name__ == "__main__":
    asyncio.run(main()) 