"""
ThoughtGenerator module for ThoughtfulLM backend.
This module provides functions for generating thoughts based on various triggers.
"""

import json
import uuid
from typing import Dict, List, Optional, Any, Literal
from datetime import datetime
import random

# Import required components from thought_kit
from thought_kit.schemas.thought_schema import Thought, ThoughtConfig, ThoughtSeed
from thought_kit.schemas.event_schema import Event
from thought_kit.schemas.common_schema import Content, Timestamps, Prompt, Score

# Import the thought store and client
from app.services.thought_store import thought_store
from app.services.thoughtkit_client import thoughtkit_client

# Define event types
EventTypes = Literal["CLICK", "IDLE_TIME", "WORD_COUNT_CHANGE", "SENTENCE_END", "NAMED_ENTITY"]

class ThoughtGenerator:
    """
    Generator for creating thoughts based on various triggers.
    This class provides methods for generating thoughts based on user input,
    idle time, word count changes, and other events.
    """
    
    async def generate_thought_from_event(
        self, 
        event_type: EventTypes, 
        event_text: str, 
        event_duration: int = -1
    ) -> Thought:
        """
        Generate a thought based on an event.
        
        Args:
            event_type: The type of event that triggered the thought
            event_text: The text content related to the event
            event_duration: Duration of the event in milliseconds, -1 for instantaneous
            
        Returns:
            The generated thought
        """
        # Create an event
        event_id = f"event_{uuid.uuid4()}"
        event = Event(
            id=event_id,
            type=event_type,
            content=Content(text=event_text),
            timestamps=Timestamps(
                created=datetime.now().isoformat(),
                updated=datetime.now().isoformat()
            ),
            duration=event_duration
        )
        
        # Create seed for the thought
        seed = ThoughtSeed(
            prompt=Prompt(
                system_prompt="You are a thoughtful AI assistant that generates insights, questions, or reflections based on the user's input.",
                user_prompt=f"Generate a brief, thoughtful reflection related to: {event_text}"
            ),
            model="gpt-4o-mini",  # Using the smaller model for quicker responses
            temperature=0.8,  # Higher temperature for more creative thoughts
            type="reflection",
            max_tokens=50  # Short thoughts
        )
        
        # Generate thought using ThoughtKit
        try:
            # Prepare the request data
            request_data = {
                "event": event.model_dump(),
                "seed": seed.model_dump(),
                "config": ThoughtConfig(
                    modality="TEXT",
                    depth=random.randint(1, 5),
                    length=random.randint(2, 5),
                    interactivity="VIEW",
                    persistent=False,
                    weight=0.0
                ).model_dump()
            }
            
            # Use the thoughtkit_client instead of calling ThoughtKit directly
            thought = await thoughtkit_client.generate_thought(request_data, return_json_str=False, return_model=True)
            
            # Add the thought to the store
            thought_store.add_thought(thought)
            
            return thought
            
        except Exception as e:
            # If ThoughtKit is unavailable, create a thought locally
            print(f"Error generating thought with ThoughtKit: {str(e)}")
            return self._create_local_thought(event, event_text)
    
    def _create_local_thought(self, event: Event, event_text: str) -> Thought:
        """
        Create a thought locally without using ThoughtKit (fallback method).
        
        Args:
            event: The event that triggered the thought
            event_text: The text content related to the event
            
        Returns:
            The generated thought
        """
        # Generate a simple thought based on the content
        thought_id = f"thought_{uuid.uuid4()}"
        now = datetime.now().isoformat()
        
        # Generate a placeholder thought content
        # In a real implementation, you might use a local LLM or templated thoughts
        placeholder_thoughts = [
            f"I wonder about the implications of '{event_text}'",
            f"What if we considered '{event_text}' from a different perspective?",
            f"How does '{event_text}' relate to broader contexts?",
            f"What assumptions are we making about '{event_text}'?",
            f"What evidence supports or contradicts '{event_text}'?"
        ]
        
        thought_content = random.choice(placeholder_thoughts)
        
        # Create a Thought object
        thought = Thought(
            id=thought_id,
            content=Content(text=thought_content),
            config=ThoughtConfig(
                modality="TEXT",
                depth=random.randint(1, 5),
                length=len(thought_content.split()),
                interactivity="VIEW",
                persistent=False,
                weight=0.0
            ),
            timestamps=Timestamps(
                created=now,
                updated=now
            ),
            trigger_event=event,
            score=Score(
                weight=0.0,
                saliency=random.uniform(0.7, 1.0)  # Random saliency between 0.7 and 1.0
            )
        )
        
        # Add the thought to the store
        thought_store.add_thought(thought)
        
        return thought

# Create a singleton instance
thought_generator = ThoughtGenerator() 