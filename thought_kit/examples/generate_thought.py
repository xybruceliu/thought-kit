"""
Example demonstrating how to generate a thought using the ThoughtGenerator.

This shows how to create a thought using the ThoughtGenerator with various inputs
including user events, thought seeds, and optional memory and previous thoughts.

Make sure to set the OPENAI_API_KEY environment variable before running this script.
"""

import os
import json
from thought_kit.modules.ThoughtGenerator import ThoughtGenerator
from thought_kit.schemas import (
    Prompt,
    ThoughtSeed,
    thought_to_json,
    json_to_thought_seed
)

# Check if OPENAI_API_KEY is set
if not os.environ.get("OPENAI_API_KEY"):
    print("⚠️ OPENAI_API_KEY environment variable is not set.")
    print("Please set it before running this script or the example will fail.")
    print("Example: export OPENAI_API_KEY=your-api-key-here")


def generate_basic_thought():
    """Generate a basic thought using the ThoughtGenerator."""
    # Initialize the ThoughtGenerator
    generator = ThoughtGenerator()
    
    # Create input data for thought generation
    input_data = {
        # User event (required)
        "user_event": {
            "text": "User asked about the impact of AI on society",
            "type": "NEW_INPUT",
            "duration": 1.5
        },
        
        # Thought seed (required)
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant considering the societal impacts of artificial intelligence.",
                "user_prompt": "What are some potential impacts of AI on society?"
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 100
        },
        
        # Thought configuration (required)
        "thought_config": {
            "modality": "TEXT",
            "depth": 3,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        }
    }
    
    # Generate the thought
    print("\n🧠 Generating a basic thought...")
    thought = generator.generate_thought(input_data)
    
    # Print the generated thought
    print("\n--- Generated Thought ---")
    print(f"Content: {thought.content.text}")
    print("\n--- Full Thought Object ---")
    print(json.dumps(thought_to_json(thought, as_string=False), indent=2))
    
    return thought


def generate_thought_with_memory():
    """Generate a thought with memory context."""
    # Initialize the ThoughtGenerator
    generator = ThoughtGenerator()
    
    # Create input data for thought generation with memory
    input_data = {
        # User event (required)
        "user_event": {
            "text": "User asked about climate change solutions",
            "type": "NEW_INPUT",
            "duration": 1.2
        },
        
        # Thought seed (required)
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are an environmental expert considering solutions to climate change.",
                "user_prompt": "What are some practical solutions to climate change?"
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "analytical",
            "max_tokens": 150
        },
        
        # Thought configuration (required)
        "thought_config": {
            "modality": "TEXT",
            "depth": 4,
            "interactivity": "EDIT",
            "persistent": True,
            "weight": 0.9
        },
        
        # Memory (optional)
        "memory": {
            "title": "User Climate Change Interests",
            "content": "The user has previously expressed interest in renewable energy solutions and carbon capture technologies. They are working on a project related to sustainable urban planning.",
            "created_at": "2023-10-15T14:30:00",
            "updated_at": "2023-10-15T14:30:00"
        }
    }
    
    # Generate the thought
    print("\n🧠 Generating a thought with memory context...")
    thought = generator.generate_thought(input_data)
    
    # Print the generated thought
    print("\n--- Generated Thought with Memory ---")
    print(f"Content: {thought.content.text}")
    
    return thought


def generate_thought_with_previous_thoughts():
    """Generate a thought with previous thoughts as context."""
    # Initialize the ThoughtGenerator
    generator = ThoughtGenerator()
    
    # First, generate a simple thought to use as previous context
    first_thought_input = {
        "user_event": {
            "text": "User asked about AI ethics",
            "type": "NEW_INPUT",
            "duration": 1.0
        },
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are considering ethical implications of AI development.",
                "user_prompt": "What are some ethical concerns with AI?"
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "ethical",
            "max_tokens": 100
        },
        "thought_config": {
            "modality": "TEXT",
            "depth": 3,
            "interactivity": "VIEW",
            "persistent": False,
            "weight": 0.7
        }
    }
    
    # Generate the first thought
    print("\n🧠 Generating first thought as context...")
    first_thought = generator.generate_thought(first_thought_input)
    print(f"First thought: {first_thought.content.text[:50]}...")
    
    # Now generate a follow-up thought using the first one as context
    follow_up_input = {
        "user_event": {
            "text": "User asked about addressing AI bias",
            "type": "FOLLOW_UP",
            "duration": 1.3
        },
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are considering solutions to ethical problems in AI.",
                "user_prompt": "How can we address bias in AI systems?"
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "solution-oriented",
            "max_tokens": 150
        },
        "thought_config": {
            "modality": "TEXT",
            "depth": 4,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        },
        "thoughts": [first_thought]  # Include the previous thought as context
    }
    
    # Generate the follow-up thought
    print("\n🧠 Generating follow-up thought with previous thought as context...")
    follow_up_thought = generator.generate_thought(follow_up_input)
    
    # Print the generated thought
    print("\n--- Generated Follow-up Thought ---")
    print(f"Content: {follow_up_thought.content.text}")
    
    return follow_up_thought


def main():
    """Run all examples."""
    print("===== ThoughtKit Thought Generation Examples =====")
    
    try:
        # Basic thought generation
        generate_basic_thought()
        
        # Thought generation with memory
        generate_thought_with_memory()
        
        # Thought generation with previous thoughts
        generate_thought_with_previous_thoughts()
        
        print("\n✅ All examples completed successfully!")
        
    except Exception as e:
        print(f"\n❌ Error running examples: {str(e)}")
        print("Make sure your OPENAI_API_KEY is set correctly.")


if __name__ == "__main__":
    main() 