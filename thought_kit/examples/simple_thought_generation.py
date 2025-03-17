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
            "type": "interpretative",
            "max_tokens": 100
        },
        "thought_config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 3,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        },
        "memory": {
            "long_term": [
                {
                    "id": "memory_12345",
                    "timestamp": {
                        "created": "2023-10-15T14:30:00",
                        "updated": "2023-10-15T14:30:00"
                    },
                    "type": "LONG_TERM",
                    "content": {
                        "text": "The user is a researcher studying AI ethics and societal impacts.",
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
                        "text": "The user recently mentioned concerns about AI automation replacing jobs.",
                        "embedding": []
                    }
                }
            ]
        },
        "thoughts": [
            {
                "id": "thought_abcdef",
                "timestamps": {
                    "created": "2023-10-15T14:40:00",
                    "updated": "2023-10-15T14:40:00"
                },
                "content": {
                    "text": "AI's societal impact requires careful ethical consideration.",
                    "embedding": []
                },
                "config": {
                    "modality": "TEXT",
                    "depth": 3,
                    "length": 8,
                    "interactivity": "COMMENT",
                    "persistent": False,
                    "weight": 0.8
                },
                "trigger_event": {
                    "id": "event_123456",
                    "timestamps": {
                        "created": "2023-10-15T14:39:00",
                        "updated": "2023-10-15T14:39:00"
                    },
                    "type": "USER_INPUT",
                    "content": {
                        "text": "I'm interested in AI ethics research.",
                        "embedding": []
                    },
                    "duration": -1
                },
                "score": {
                    "weight": 0.8,
                    "saliency": 0.7
                }
            }
        ]
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