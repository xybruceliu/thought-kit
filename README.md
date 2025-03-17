# ThoughtKit 💭
A modular Python toolkit for generating, manipulating, and articulating AI thoughts as an interactive modality in human-AI interaction.

## Installation

### Prerequisites
- Python 3.8+
- OpenAI API key

### From Source
```bash
# Clone repository
git clone https://github.com/yourusername/thought-kit.git
cd thought-kit

# Install package
pip install -e .

# Install spaCy model
python -m spacy download en_core_web_sm
```

### Install via pip (🚧 Work in progress)
```bash
pip install thought-kit
```

### API Key Setup
```bash
# Set environment variable
export OPENAI_API_KEY=your-api-key-here  # On Windows: set OPENAI_API_KEY=your-api-key-here

# Or in Python
import os
os.environ["OPENAI_API_KEY"] = "your-api-key-here"
```

## Project Structure

ThoughtKit follows a layered architecture design:

### Core Components

1. **Schemas** (`thought_kit/schemas/`)
   - Define data models using Pydantic
   - Provide validation and type safety
   - Include models for Thoughts, Events, Memory, etc.

2. **Modules** (`thought_kit/modules/`)
   - Implement core functionality
   - `ThoughtGenerator`: Creates thoughts based on events and context
   - `ThoughtArticulator`: Transforms thoughts into different modalities
   - `ThoughtOperator`: Performs operations on thoughts (filtering, ranking, etc.)

3. **Utilities** (`thought_kit/utils/`)
   - Provide helper functions and tools
   - LLM API integration
   - JSON conversion

### API Layer

The API layer (`thought_kit/api.py`) serves as a facade over the underlying implementation:

- **Simplifies interaction** with the complex subsystem
- **Handles JSON conversion** between the API boundary and internal objects
- **Coordinates** between different modules
- **Provides a stable interface** that shields users from implementation changes

This separation of concerns allows:
- Users to work with a simple, consistent interface
- Developers to modify internal implementations without breaking client code
- Clear boundaries between JSON (for external use) and typed objects (for internal use)

## Getting Started

### Using the API

```python
import asyncio
from thought_kit import api

async def main():
    # Create input data
    input_data = {
        "event": {
            "text": "I'm researching the impact of AI on society.",
            "type": "USER_INPUT",
            "duration": -1
        },
        "thought_seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant.",
                "user_prompt": "What are some potential impacts of AI on society?"
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 100
        },
        "thought_config": {
            "modality": "TEXT",
            "depth": 3,
            "length": 5,
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8
        }
    }
    
    # Generate thought (returns JSON string)
    thought_json = await api.generate_thought(input_data)
    print(f"Generated thought: {thought_json[:100]}...")
    
    # Or get a Thought object
    thought = await api.generate_thought(input_data, return_json=False)
    print(f"Thought content: {thought.content.text}")

asyncio.run(main())
```

See more examples in the `thought_kit/examples/` directory.

