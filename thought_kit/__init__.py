"""
ThoughtKit: A modular Python toolkit for generating, manipulating, evaluating, 
and articulating AI thoughts as an interactive modality in human-AI interaction.
"""

__version__ = "0.1.0"

# Import main components for easier access
from .schemas import (
    Thought,
    ThoughtSeed,
    SimpleThoughtInput,
    Memory,
    SimpleMemoryInput,
    Prompt,
    UserEvent,
    SimpleUserEventInput,
    thought_to_json,
    json_to_thought,
    thought_seed_to_json,
    json_to_thought_seed,
    create_thought_from_simple_input,
    json_to_simple_thought_input,
    simple_json_to_thought,
    prompt_to_json,
    json_to_prompt,
    memory_to_json,
    json_to_memory,
    simple_json_to_memory,
    user_event_to_json,
    json_to_user_event,
    create_user_event_from_simple_input,
    simple_json_to_user_event
)

from .utils import (
    SentenceSplitter,
    get_completion,
    get_embedding_sync
)
