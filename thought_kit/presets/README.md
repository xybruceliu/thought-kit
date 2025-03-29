# ThoughtKit Presets

This directory contains preset configurations for thought generation, including:

- Thought seeds: Predefined prompts and configurations for generating different types of thoughts
- Preset utilities: Functions for loading and using presets

## Thought Seeds

The `thought_seeds` directory contains JSON configurations for various types of thoughts:

- **association.json**: Generates associative thoughts that connect related concepts
- **disambiguation.json**: Helps clarify ambiguous terms or statements
- **empathy.json**: Creates empathetic responses to user emotions
- **interpretation.json**: Provides interpretations of user input
- **reference.json**: Generates reference information or facts
- **scaffolding.json**: Helps structure or organize information

## Usage

You can use these presets with the `use_preset_seed` function:

```python
import asyncio
from thought_kit import thoughtkit

async def generate_with_preset():
    # Use a preset seed
    input_data = {
        "event": {
            "text": "I'm not sure if this code will work with my database.",
            "type": "SENTENCE_END"
        },
        "seed": "disambiguation",  # Use the disambiguation preset
        "config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 10,
            "weight": 0.8
        }
    }
    
    thought = await thoughtkit.generate(input_data, return_json_str=False)
    print(f"Thought: {thought['content']['text']}")

if __name__ == "__main__":
    asyncio.run(generate_with_preset())
```

See `thought_kit/examples/use_preset_seeds.py` for more examples. 