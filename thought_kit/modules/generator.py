"""
Thought Generator module for generating AI thoughts based on various inputs.
"""

import uuid
from datetime import datetime
from typing import List, Optional
import json

from thought_kit.schemas import (
    Thought,
    ThoughtSeed,
    ThoughtConfig,
    Event,
    Memory,
    Content,
    Timestamps
)
from thought_kit.schemas.event_schema import SimpleEventInput, create_event_from_simple_input
from thought_kit.schemas.common_schema import Score
from thought_kit.utils import get_completion, get_embedding
from thought_kit.schemas.definitions.depth_levels import get_depth_description

class ThoughtGenerator:
    """
    Generator class for creating AI thoughts based on various inputs.
    """
    
    def __init__(self):
        """Initialize the ThoughtGenerator."""
        pass
        
    async def generate(
        self,
        event_input: SimpleEventInput,
        seed: ThoughtSeed,
        config: ThoughtConfig,
        memory: Optional[Memory] = None,
        previous_thoughts: Optional[List[Thought]] = None
    ) -> Thought:
        """
        Generate a thought based on event input, seed, config, memory, and previous thoughts.
        
        Args:
            event_input: SimpleEventInput containing basic event information
            seed: Seed data for thought generation
            config: Configuration for thought generation
            memory: Optional memory context
            previous_thoughts: Optional list of previous thoughts

        Returns:
            The generated thought as Thought object.
        """

        # Initialize previous_thoughts if None
        if previous_thoughts is None:
            previous_thoughts = []
        
        # Convert SimpleEventInput to Event
        trigger_event = await create_event_from_simple_input(event_input)
                
        # Generate the thought content
        thought_content, saliency = await self._generate_content(trigger_event, seed, config, memory, previous_thoughts)
        
        # Create the thought object
        cur_timestamp=datetime.now()
        thought = Thought(
            id=f"thought_{uuid.uuid4().hex[:8]}",
            timestamps=Timestamps(
                created=cur_timestamp,
                updated=cur_timestamp
            ),
            content=Content(
                text=thought_content,
                embedding=await get_embedding(thought_content)
            ),
            config=config,
            seed=seed,
            trigger_event=trigger_event,
            references=[],
            user_comments=[],
            score=Score(
                weight=config.weight,
                saliency=saliency
            ),
        )
        
        return thought
        
    async def _generate_content(
        self,
        trigger_event: Event,
        seed: ThoughtSeed,
        config: ThoughtConfig,
        memory: Optional[Memory] = None,
        previous_thoughts: Optional[List[Thought]] = None
    ) -> tuple[str, float]:
        """
        Generate the content for a thought based on the provided inputs.
        
        Args:
            trigger_event: Event that triggered the thought
            seed: Seed data for thought generation
            config: Configuration for thought generation
            memory: Optional memory context
            previous_thoughts: Optional list of previous thoughts
            
        Returns:
            Tuple of (thought_content, saliency)
        """
        # Extract prompts from thought seed
        system_prompt = seed.prompt.system_prompt
        user_prompt = seed.prompt.user_prompt
        
        # Get depth description
        depth_description = get_depth_description(config.depth)
        
        # Build context sections
        context_sections = []
        
        # Event context section
        event_lines = [
            "## Event (what triggered the thought)",
            f"Type: {trigger_event.type}",
            f"Event Content: \"{trigger_event.content.text}\"",
            ""
        ]
        context_sections.append("\n".join(event_lines))
        
        # Thought configuration context section
        config_lines = [
            "## Thought Configuration (additional specifications for the thought)",
            f"Modality: {config.modality}",
            f"Depth: {config.depth} - {depth_description}",
            f"Length: Maximum {config.length} words",
            ""
        ]
        context_sections.append("\n".join(config_lines))
        
        # Memory context section
        if memory:
            memory_lines = ["## Memory"]
            
            # Long-term memory
            if hasattr(memory, 'long_term') and memory.long_term:
                memory_lines.append("Long-term memory (persona, background, etc.):")
                if isinstance(memory.long_term, list) and memory.long_term:
                    memory_lines.append("\n".join(item.content.text for item in memory.long_term))
                else:
                    memory_lines.append(str(memory.long_term))
            
            # Short-term memory
            if hasattr(memory, 'short_term') and memory.short_term:
                memory_lines.append("Short-term memory (conversation history):")
                if isinstance(memory.short_term, list) and memory.short_term:
                    memory_lines.append("\n".join(item.content.text for item in memory.short_term))
                else:
                    memory_lines.append(str(memory.short_term))
            
            memory_lines.append("")
            context_sections.append("\n".join(memory_lines))
        
        # Previous thoughts context section
        if previous_thoughts and previous_thoughts:
            # Sort previous thoughts by saliency score and take top 3
            sorted_thoughts = sorted(previous_thoughts, key=lambda t: t.score.saliency, reverse=True)
            top_thoughts = sorted_thoughts[:min(3, len(sorted_thoughts))]
            
            if top_thoughts:
                thought_lines = [
                    "## Previous Thoughts (highest scoring thoughts of yours)",
                    *[f"- \"{thought.content.text}\"" for thought in top_thoughts],
                    ""
                ]
                context_sections.append("\n".join(thought_lines))
        
        # Combine all context sections
        context_str = "\n".join(context_sections)
        
        # Construct the final user prompt with context
        final_user_prompt = f"""<Task Instructions>
{user_prompt}

<Context Information>
{context_str}

<Generation Guidelines>
1. Generate exactly ONE thought that directly responds to the task instructions while considering the context.

2. IMPORTANT: Focus primarily on the EVENT that triggered this thought. The event is the most important context element and should be the main driver of your thought generation. Avoid generating thoughts that are too similar to previous ones.

3. Adhere to the specified MODALITY:
   - TEXT: Generate a textual thought
   - EMOJI: Express the thought using emoji(s) that capture the essence of the idea
   - VISUAL: Describe a visual representation that could express this thought
   
4. Follow the specified DEPTH level:
   - 1: Very Superficially - Do not think deeply at all, just glance quickly or rely entirely on impressions or feelings.
   - 2: Somewhat Superficially - Consider a few aspects, but mostly rely on quick impressions or simple cues.
   - 3: Moderately - Give moderate thought to the content, considering both simple cues and some message details.
   - 4: Somewhat Deeply - Evaluate the message thoughtfully, analyzing arguments with considerable attention and cognitive effort.
   - 5: Very Deeply - Carefully and systematically analyze and scrutinize the content, paying close attention to argument quality and details.

5. Respect the LENGTH constraint:
   - Keep your thought to a maximum of {config.length} words

6. Prioritization rules:
   - User prompt instructions ALWAYS take precedence over context information
   - The triggering EVENT should be weighted more heavily than memory or previous thoughts
   - When facing contradictions, follow user prompt requirements
   - Avoid generating thoughts too similar to previous ones

<Saliency Evaluation>
Evaluate the thought's saliency (0-10) based on how it builds common ground with the user:
- 0-3: Low contribution
  • Minimal shared understanding
  • Doesn't acknowledge user's perspective
- 4-7: Medium contribution
  • Aligns with user's mental model
  • Bridges knowledge gaps
  • Clarifies misunderstandings
- 8-10: High contribution
  • Significantly enhances mutual understanding
  • Creates coherence between context and new information
  • Establishes clear reference points for future communication

<Response Format>
Respond with a JSON object containing:
{{
  "thought": "Your generated thought here",
  "saliency":  "number between 0 and 10"
}}
"""
        
        # Get completion from LLM
        response = await get_completion(
            system_prompt=system_prompt,
            user_prompt=final_user_prompt,
            model=seed.model,
            temperature=seed.temperature,
            max_tokens=seed.max_tokens,
            response_format="json_object"
        )
        
        # Parse the response to extract the thought and saliency
        try:
            response_data = json.loads(response)
            thought_text = response_data.get("thought", "")
            saliency = float(response_data.get("saliency", 0))/10
            
            return thought_text, saliency
        except (json.JSONDecodeError, ValueError):
            # If parsing fails, return the raw response and a default saliency
            return response, 0.0
       
       