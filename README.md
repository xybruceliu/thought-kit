# ThoughtKit 💭

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A modular Python toolkit for generating, manipulating, and articulating AI thoughts as an interactive modality in human-AI interaction.

## Contents

- [Overview](#overview)
- [Installation](#installation)
- [Core Components](#core-components)
- [Thought Generation](#thought-generation)
- [Thought Operations](#thought-operations)
- [Frontend Architecture](#frontend-architecture)
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
- **Text Processing**: Simple text analysis and manipulation with regex-based sentence splitting

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
            "type": "WORD_COUNT_CHANGE",
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
- **dislike**: Decreases a thought's weight by a specified amount (default: 0.1). Weights are rounded to 2 decimal places and have a minimum of 0.0.
- **react**: Adds a user reaction (text, emoji, etc.) to a thought's comments and increases its weight by a specified amount (default: 0.1).

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

## Frontend Architecture

ThoughtKit includes a modern React frontend for visualizing thoughts on an interactive canvas.

For a detailed architectural overview with visual diagrams, see the [Frontend Architecture Document](/thoughtfulLM/frontend/ARCHITECTURE.md).

### Multi-layered Architecture

The frontend follows a clean, multi-layered architecture for separation of concerns:

1. **Data Layer**: Manages the application data
   - `thoughtStore.ts`: Manages thought content, properties, API communication
   - `inputStore.ts`: Manages input field state and text
   - `memoryStore.ts`: Manages context for thought generation

2. **Connector Layer**: Bridges data and visualization
   - `nodeConnectors.ts`: Functions that connect data operations to visualization
   - Handles creation, deletion, updates, and consistency checks

3. **Visualization Layer**: Manages the UI representation
   - `nodeStore.ts`: Single source of truth for ReactFlow nodes and positions
   - Implements properly typed node data for each node type

### State Management

The application uses Zustand for state management with specialized stores:

- **NodeStore**: Unified store for all visual nodes (thoughtBubble, textInput, response)
  - Single source of truth for ReactFlow nodes and their positions
  - Handles node operations (add, update, delete, position)

- **ThoughtStore**: Manages thought data and API operations
  - Handles API calls to generate thoughts
  - Manages thought properties (weight, persistence, etc.)

- **InputStore**: Manages input field data
  - Tracks text input state and triggers
  - Manages baseline detection for thought generation

### Data Flow

1. **User Input → Thought Generation → Visualization**:
   ```
   User types → InputStore updated → Trigger detected → 
   API call via ThoughtStore → Thought created → 
   createThoughtNode called → Node added to NodeStore → 
   ReactFlow renders the node
   ```

2. **User Interaction with Nodes**:
   ```
   User drags node → ReactFlow updates → 
   NodeStore position updated
   ```

3. **Data Integrity**:
   ```
   ThoughtStore updates → Canvas detects thought changes →
   ensureNodesForThoughts → NodeStore creates missing nodes
   ```

The architecture ensures a clean separation between data management and visualization, making the codebase more maintainable and extensible.

### Node Types

- **TextInputNode**: User input fields
- **ThoughtBubbleNode**: Visualizations of AI thoughts
- **ResponseNode**: AI responses with animations

For detailed information about the frontend implementation, see the [frontend README](/thoughtfulLM/frontend/README.md).

## Examples

See the `thought_kit/examples/` directory for more examples:

- `api_thought_generation.py`: Basic thought generation with memory context
- `api_thought_operation.py`: Using ThoughtOperator to like thoughts with weight management
- `api_thought_articulation.py`: Articulating thoughts into coherent responses

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

