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

## Getting Started

```python
from thought_kit import simple_json_to_thought

# Create a simple thought
thought = simple_json_to_thought({
    "text": "Climate change is accelerating faster than previously predicted",
    "modality": "TEXT",
    "interactivity": "COMMENT",
    "weight": 0.8
})

print(thought)
```

See more examples in the `thought_kit/examples/` directory.
