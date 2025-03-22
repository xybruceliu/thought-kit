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

# Import modules
from .modules import (
    ThoughtGenerator,
    ThoughtOperator,
    ThoughtArticulator
)

# Import utility functions
from .utils import (
    SentenceSplitter,
    get_completion,
    get_embedding,
    to_json,
    from_json
)

# Import preset functions
from .presets import (
    get_available_thought_seeds,
    load_thought_seed,
    save_thought_seed
)

# Import main API class
from .api import ThoughtKitAPI

# Create an instance for easier use
thoughtkit = ThoughtKitAPI()  