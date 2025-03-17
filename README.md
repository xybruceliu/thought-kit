# ThoughtKit 💭

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A modular Python toolkit for generating, manipulating, and articulating AI thoughts as an interactive modality in human-AI interaction.

## Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Components](#core-components)
- [Thought Generation](#thought-generation)
- [Thought Operations](#thought-operations)
- [Examples](#examples)
- [Development Status](#development-status)
- [License](#license)

## Overview

ThoughtKit enables AI systems to generate, process, and express thoughts in response to user interactions. It provides a structured way to represent AI thinking processes, making them more transparent and interactive.

Key capabilities:
- Generate AI thoughts with configurable depth, length, and modality
- Perform operations on thoughts (liking, filtering, etc.)
- Incorporate memory and context into thought generation
- Transform thoughts between different modalities

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

# Install spaCy model (required for text processing)
python -m spacy download en_core_web_sm
```

### API Key Setup
```bash
# Set environment variable
export OPENAI_API_KEY=your-api-key-here  # On Windows: set OPENAI_API_KEY=your-api-key-here

# Or in Python
import os
os.environ["OPENAI_API_KEY"] = "your-api-key-here"
```

## Core Components

### Schemas
- **Thought**: Core data model with content, configuration, and metadata
- **Event**: Represents user interactions that trigger thoughts
- **Memory**: Long and short-term context structures

### Modules
- **ThoughtGenerator**: Creates thoughts based on events and context
- **ThoughtOperator**: Performs operations on thoughts (like, etc.)
- **ThoughtArticulator**: Transforms thoughts between modalities

### Utilities
- **LLM API**: OpenAI API integration
- **Conversion**: JSON serialization/deserialization
- **Text Processing**: Text analysis and manipulation

## Thought Generation

Generate thoughts in response to events with configurable parameters:

```python
import asyncio
from thought_kit import thoughtkit

async def generate():
    # Create input data
    input_data = {
        "event": {
            "text": "I'm researching the impact of AI on society.",
            "type": "USER_INPUT",
            "duration": -1
        },
        "seed": {
            "prompt": {
                "system_prompt": "You are a thoughtful AI assistant.",
                "user_prompt": "Generate a thought about the user's research topic."
            },
            "model": "gpt-4o-mini",
            "temperature": 0.7,
            "type": "reflective",
            "max_tokens": 100
        },
        "config": {
            "modality": "TEXT",
            "depth": 3,  # 1-5 scale (shallow to deep)
            "length": 5,  # Max words
            "interactivity": "COMMENT",
            "persistent": False,
            "weight": 0.8  # Importance (0-1)
        }
    }
    
    # Generate thought
    thought = await thoughtkit.generate(input_data, return_json_str=False)
    print(f"Thought: {thought['content']['text']}")
    
    # Get JSON representation
    thought_json = await thoughtkit.generate(input_data)
    print(f"JSON: {thought_json[:50]}...")

if __name__ == "__main__":
    asyncio.run(generate())
```

## Thought Operations

ThoughtKit provides a simple API for performing operations on thoughts.

### Basic Usage

```python
from thought_kit import thoughtkit

# Get available operations
operations = thoughtkit.available_operations()
print(f"Available operations: {operations}")

# Using JSON input
operation_input = {
    "operation": "like",
    "thoughts": [thought],
    "options": {
        "amount": 0.2
    }
}
updated_thought = thoughtkit.operate(operation_input, return_json_str=False)
```

### Operating on Multiple Thoughts

```python
# Create input data for multiple thoughts
operation_input = {
    "operation": "like",
    "thoughts": [thought1, thought2, thought3],
    "options": {
        "amount": 0.1
    }
}

# Process multiple thoughts at once
updated_thoughts = thoughtkit.operate(operation_input, return_json_str=False)
```

### Using JSON String Input

```python
import json

# Create JSON string input
json_input = json.dumps({
    "operation": "like",
    "thoughts": [thought.dict()],
    "memory": memory.dict(),  # Optional
    "options": {
        "amount": 0.3
    }
})

# Process using JSON string
updated_thought = thoughtkit.operate(json_input, return_json_str=False)
```

### Available Operations

Currently, ThoughtKit includes the following operations:

- **like**: Increases a thought's weight by a specified amount (default: 0.1). Weights are rounded to 2 decimal places and capped at 1.0.

### Custom Operations

Create an operation file in `thought_kit/modules/operations/`:

```python
# my_operation.py
from thought_kit.schemas import Thought, Memory
from typing import List, Optional

def my_operation(thoughts: List[Thought], memory: Optional[Memory] = None, **options) -> List[Thought]:
    # Implement your operation logic here
    return thoughts
```

The operation will be automatically discovered and loaded when the ThoughtKit API is initialized.

### Advanced Usage

If you need more control, you can still use the ThoughtOperator directly:

```python
from thought_kit.modules.operator import ThoughtOperator

# Create operator and register operations
operator = ThoughtOperator()
operator.load_operations()

# Run operations on a thought
updated_thought = operator.operate("like", thought)
```

## Examples

See the `thought_kit/examples/` directory for more examples:

- `api_thought_generation.py`: Basic thought generation with memory context
- `api_thought_operation.py`: Using ThoughtOperator to like thoughts with weight management
- `api_thought_articulation.py`: Articulating thoughts into coherent responses

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

