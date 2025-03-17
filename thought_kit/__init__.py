"""
ThoughtKit: A modular Python toolkit for generating, manipulating, evaluating, 
and articulating AI thoughts as an interactive modality in human-AI interaction.
"""

__version__ = "0.1.0"

# Import core models for type hints
from .schemas import (
    Thought,
    ThoughtSeed,
    ThoughtConfig,
    Memory,
    Prompt,
    Event
)

# Import main API class
from .api import ThoughtKit

# Import utility functions
from .utils import (
    SentenceSplitter,
    get_completion,
    get_embedding,
    to_json,
    from_json
)

# Create an API instance for easier use
api = ThoughtKit()
