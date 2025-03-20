"""
Simple example of generating a thought using the ThoughtKit API.
"""

import asyncio
from thought_kit import thoughtkit

async def main():
    
    # Create input data
    input_data = {
        "event": {
            "text": "I'm researching the impact of AI on society. I'm interested in the potential benefits and risks.",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant.",
                "user_prompt": "Generate a thought that is an interpretation of the user's input."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "interpretative",
            "max_tokens": 100
        },
        "config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 3,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.5
        },
        "memory": {
            "chunks": [],
            "embeddings": []
        }
    }

    # Generate a thought
    thought = await thoughtkit.generate(input_data)
    
    # Print the thought
    print("Generated thought:")
    print(f"ID: {thought['id']}")
    print(f"Content: {thought['content']['text']}")
    print(f"Created: {thought['timestamps']['created']}")

    # Create a different input to show streaming
    stream_input_data = {
        "event": {
            "text": "What are the most pressing ethical concerns with large language models?",
            "type": "WORD_COUNT_CHANGE",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant with expertise in AI ethics.",
                "user_prompt": "Generate a critical thought about the user's query."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "analytical",
            "max_tokens": 150
        },
        "config": {
            "modality": "TEXT",
            "depth": 4,
            "length": 5,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.7
        },
        "memory": {
            "chunks": [],
            "embeddings": []
        }
    }
    
    # Generate thought with streaming
    print("\nGenerating thought with streaming:")
    async for chunk in thoughtkit.generate_stream(stream_input_data):
        # In a real application, you would parse and handle the chunks
        # Here we just print them for demonstration
        print(f"Received chunk: {chunk}")
    
    print("\nStreaming complete")

if __name__ == "__main__":
    asyncio.run(main()) 