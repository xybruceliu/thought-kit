"""
ThoughtArticulator module for articulating thoughts into a coherent response.
"""

import json
from typing import List, Optional
from thought_kit.schemas import Thought, Memory
from thought_kit.utils import get_completion

class ThoughtArticulator:
    """
    Articulator class for transforming a set of thoughts into a coherent response.
    """
    
    def __init__(self):
        """Initialize the ThoughtArticulator."""
        pass
        
    async def articulate(
        self,
        thoughts: List[Thought],
        memory: Optional[Memory] = None,
        model: str = "gpt-4o",
        temperature: float = 0.7,
    ) -> str:
        """
        Articulate a set of thoughts into a coherent response.
        
        Args:
            thoughts: List of thoughts to articulate
            memory: Optional memory context
            model: LLM model to use for articulation
            temperature: Temperature for LLM generation
                
        Returns:
            The articulated response as a string
        """
        # If no thoughts provided, return empty response
        if not thoughts:
            return ""
            
        # Sort thoughts by saliency + weight
        sorted_thoughts = sorted(thoughts, key=lambda t: t.score.saliency + t.score.weight, reverse=True)
        
        # Build context for articulation
        context_sections = []
        
        # Thoughts context section
        thought_lines = ["## Selected Thoughts (ordered by importance)"]
        for i, thought in enumerate(sorted_thoughts, 1):
            importance_score = thought.score.saliency + thought.score.weight
            user_comments = thought.user_comments
            if user_comments:
                user_comments_str = ", ".join(user_comments)
                thought_lines.append(f"{i}. [Importance: {importance_score:.2f}] \"{thought.content.text}\" (User comments: {user_comments_str})")
            else:
                thought_lines.append(f"{i}. [Importance: {importance_score:.2f}] \"{thought.content.text}\"")
        thought_lines.append("")
        context_sections.append("\n".join(thought_lines))
        
        # Memory context section
        if memory:
            memory_lines = ["## Memory Context"]
            
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
        
        # Combine all context sections
        context_str = "\n".join(context_sections)
        
        # Create system prompt
        system_prompt = """You are an articulate AI assistant that generate a response to the user based on your previous thoughts.
Do not mention that you are transforming thoughts or that you have access to internal thoughts.
Just create a natural response to the previous user message using the provided thoughts as your foundation."""
        
        # Create user prompt
        user_prompt = f"""<Context>
{context_str}

<Task>
Compose a natural, coherent response using the provided thoughts as your foundation. 
Consider the following guidelines:
1. Prioritize thoughts with higher importance score when crafting your response
2. If user comments are provided, consider them when crafting your response
3. Maintain the key insights and perspectives from the thoughts
4. Create a cohesive flow rather than listing thoughts in sequence
5. Use a natural, conversational tone
6. Do not mention that you are using "thoughts" or that this is an articulation process
7. If memory context is provided, ensure your response is consistent with it

<Response Format>
Provide your response directly, as if you are responding to the user.
Do not include any meta-commentary about the process or the thoughts.
"""
        
        # Get completion from LLM
        response = await get_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            model=model,
            temperature=temperature,
        )
        
        return response.strip()
