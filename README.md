# ThoughtKit 💭

[![License: Apache 2.0](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

A modular Python toolkit for generating, manipulating, and articulating AI thoughts as an interactive modality in human-AI interaction.
Plus a Web UI allowing you to visualize and interact with AI thoughts on a canvas.

## Contents

- [Local Setup](#local-setup)
- [Deployment](#deployment)
- [Core Components](#core-components)
- [Thought Generation](#thought-generation)
- [Thought Operations](#thought-operations)
- [Frontend Architecture](#frontend-architecture)
- [Examples](#examples)
- [License](#license)


## Local Setup

### Prerequisites
- Python 3.8+
- OpenAI API key

### Install thought-kit package
1. Create and activate a virtual environment:
   ```bash
   python -m venv thought_kit_env
   source thought_kit_env/bin/activate  # On Windows: thought_kit_env\Scripts\activate
   ```

2. Install the package in development mode:
   ```bash
   pip install -e .
   ```

3. Configure your OpenAI API key
   ```bash
   # Set as environment variable
   export OPENAI_API_KEY=your_api_key_here  # On Windows: set OPENAI_API_KEY=your_api_key_here
   
   # Or create a .env file in thinkaloudLM/backend directory
   echo "OPENAI_API_KEY=your_api_key_here" > thinkaloudLM/backend/.env
   ```


### Backend Setup
1. Install the backend dependencies:
   ```bash
   cd thinkaloudLM/backend
   pip install -r requirements.txt
   ```

2. Start the backend server:
   ```bash
   python run.py
   ```

2. Start the frontend development server:
   ```bash
   cd thinkaloudLM/frontend
   npm start
   ```


### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd thinkaloudLM/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the frontend development server: 
   ```bash
   npm start
   ```

4. Open your browser and visit `http://localhost:3000`

## Deployment

### Deploy to Vercel (Recommended)

1. **Prepare for deployment:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

2. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Deploy to Vercel"
   git push origin main
   ```

3. **Deploy via Vercel Dashboard:**
   - Go to [vercel.com/dashboard](https://vercel.com/dashboard)
   - Click "New Project" and import your GitHub repository
   - Add environment variable: `OPENAI_API_KEY` with your OpenAI API key
   - Click "Deploy"

4. **Alternative - Deploy via CLI:**
   ```bash
   npx vercel
   # Follow prompts, then for production:
   npx vercel --prod
   ```

Your demo will be live at `https://your-project-name.vercel.app`

## Core Components

### Schemas
- **Thought**: Core data model with content, configuration, and metadata
- **Event**: Represents user interactions that trigger thoughts
- **Memory**: Long and short-term context structures

### Modules
- **ThoughtGenerator**: Creates thoughts based on events and context
- **ThoughtOperator**: Performs operations on thoughts
- **ThoughtArticulator**: Transforms thoughts between modalities

### Utilities
- **LLM API**: OpenAI API integration
- **Conversion**: JSON serialization/deserialization
- **Text Processing**: Text analysis and manipulation

## Thought Generation

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
                "system_prompt": "You are an AI assistant.",
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

### Available Operations

Currently, ThoughtKit includes the following operations:

- **like**: Increases a thought's weight
- **dislike**: Decreases a thought's weight
- **react**: Adds a user reaction to a thought

## Frontend Architecture

ThoughtKit includes a modern React frontend for visualizing thoughts on an interactive canvas.

For more details, see the [Frontend Architecture Document](/thinkaloudLM/frontend/ARCHITECTURE.md).

### Multi-layered Architecture

The frontend follows a multi-layered architecture:

1. **Data Layer**: Manages application data (thoughts, input, memory)
2. **Connector Layer**: Bridges data and visualization
3. **Visualization Layer**: Manages UI representation with ReactFlow

### Node Types

- **TextInputNode**: User input fields
- **ThoughtBubbleNode**: Visualizations of AI thoughts
- **ResponseNode**: AI responses with animations

For more information, see the [frontend README](/thinkaloudLM/frontend/README.md).

## Examples

The `thought_kit/examples/` directory contains example use cases:

- `api_thought_generation.py`: Basic thought generation with memory context
- `api_thought_operation.py`: Using ThoughtOperator to like thoughts
- `api_thought_articulation.py`: Articulating thoughts into coherent responses
- `use_preset_seeds.py`: Using preset prompts and configurations

## License

This project is licensed under the Apache License, Version 2.0 - see the [LICENSE](LICENSE) file for details.

