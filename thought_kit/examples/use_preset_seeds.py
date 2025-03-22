"""Example of using predefined thought seeds."""

import asyncio
from thought_kit import thoughtkit

async def main():
    """
    Main function to demonstrate using predefined thought seeds.
    """
    # Get available thought seeds
    available_seeds = thoughtkit.get_available_thought_seeds()
    print(f"Available thought seeds: {', '.join(available_seeds)}")
    
    # Create a simple event
    event_data = {
        "text": "I'm researching the ethical implications of AI in healthcare.",
        "type": "WORD_COUNT_CHANGE",
        "duration": -1
    }
    
    # Create a basic thought configuration
    config_data = {
        "modality": "TEXT",
        "depth": 3,
        "length": 3,
        "interactivity": "COMMENT",
        "persistent": False,
        "weight": 0.8
    }
    
    # Try each available seed
    for seed_name in available_seeds:
        print(f"\n--- Using {seed_name} seed ---")
        
        # Load the thought seed
        seed = thoughtkit.load_thought_seed(seed_name)
        if not seed:
            continue
        
        # Generate thought using the thought seed
        input_data = {
            "event": event_data,
            "seed": seed,
            "config": config_data
        }
        
        # Generate thought
        try:
            thought = await thoughtkit.generate(input_data, return_json_str=False)
            print(f"Thought content: {thought['content']['text']}")
        except Exception as e:
            print(f"Error generating thought with {seed_name} seed: {str(e)}")
    
    # Example of saving a custom thought seed
    print("\n--- Creating a custom thought seed ---")
    custom_seed = {
        "prompt": {
            "system_prompt": "You are a creative AI assistant focused on generating unconventional ideas.",
            "user_prompt": "Think of some unusual but potentially valuable applications of the user's current focus."
        },
        "model": "gpt-4o",
        "temperature": 0.8,
        "type": "custom",
        "max_tokens": 120
    }
    
    success = thoughtkit.save_thought_seed("custom_example", custom_seed)
    if success:
        print("✅ Custom thought seed saved successfully!")
        
        # Test using the custom thought seed
        seed = thoughtkit.load_thought_seed("custom_example")
        input_data = {
            "event": event_data,
            "seed": seed,
            "config": config_data
        }
        
        try:
            thought = await thoughtkit.generate(input_data, return_json_str=False)
            print(f"Custom thought content: {thought['content']['text']}")
        except Exception as e:
            print(f"Error generating thought with custom seed: {str(e)}")
    else:
        print("❌ Failed to save custom thought seed")

if __name__ == "__main__":
    asyncio.run(main()) 