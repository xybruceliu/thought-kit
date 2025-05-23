"""OpenAI API interaction functions."""
import os
from typing import List, Dict, Optional, Any
from openai import OpenAI, APIError
import logging
import asyncio
import time

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Disable httpx logs
logging.getLogger("httpx").setLevel(logging.WARNING)

class LLMAPIError(Exception):
    """Custom exception for LLM API errors."""
    pass

def get_client() -> OpenAI:
    """Get OpenAI client with API key validation.
    
    Returns:
        OpenAI client instance
        
    Raises:
        LLMAPIError: If OPENAI_API_KEY is not set
    """
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise LLMAPIError("OPENAI_API_KEY environment variable not set")
    return OpenAI(api_key=api_key)

async def get_completion(
    system_prompt: str,
    user_prompt: str,
    model: str = "gpt-4o-mini",
    temperature: float = 1.0,
    max_retries: int = 3,
    response_format: Optional[str] = None
) -> Dict[str, Any]:
    """Get completion from OpenAI API.
    
    Args:
        system_prompt: System message
        user_prompt: User message/query
        model: Model to use (default: gpt-4o-mini)
        temperature: Sampling temperature (default: 1.0)
        max_retries: Maximum number of retry attempts (default: 3)
        response_format: Response format type, e.g. "json" (optional)
        
    Returns:
        Dictionary containing:
            - 'text': Generated text response
        
    Raises:
        LLMAPIError: If API call fails after retries or other errors occur
    """
    client = get_client()
    for attempt in range(max_retries):
        try:
            completion_args = {
                "model": model,
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": temperature,
                "top_p": 1.0
            }
            
            if response_format:
                completion_args["response_format"] = {"type": response_format}
            
            response = client.chat.completions.create(**completion_args)
            
            result = response.choices[0].message.content
            return result
            
        except APIError as e:
            if e.status_code == 429:  # Rate limit error
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Rate limit hit, retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    continue
            logger.error(f"OpenAI API error: {str(e)}")
            raise LLMAPIError(f"OpenAI API error: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LLMAPIError(f"Unexpected error: {str(e)}")
    
    raise LLMAPIError("Max retries exceeded")


# Async version of the embedding function
async def get_embedding(
    text: str,
    model: str = "text-embedding-3-small",
    max_retries: int = 3
) -> List[float]:
    """Get text embedding from OpenAI API asynchronously.
    
    Args:
        text: Text to get embedding for
        model: Model to use (default: text-embedding-3-small)
        max_retries: Maximum number of retry attempts (default: 3)
        
    Returns:
        List of embedding values
        
    Raises:
        LLMAPIError: If API call fails after retries or other errors occur
    """
    if not text.strip():
        raise ValueError("Empty text provided for embedding")
        
    client = get_client()
    for attempt in range(max_retries):
        try:
            response = client.embeddings.create(
                model=model,
                input=text
            )
            return response.data[0].embedding
            
        except APIError as e:
            if e.status_code == 429:  # Rate limit error
                if attempt < max_retries - 1:
                    wait_time = 2 ** attempt  # Exponential backoff
                    logger.warning(f"Rate limit hit, retrying in {wait_time} seconds...")
                    await asyncio.sleep(wait_time)
                    continue
            logger.error(f"OpenAI API error: {str(e)}")
            raise LLMAPIError(f"OpenAI API error: {str(e)}")
            
        except Exception as e:
            logger.error(f"Unexpected error: {str(e)}")
            raise LLMAPIError(f"Unexpected error: {str(e)}")
    
    raise LLMAPIError("Max retries exceeded")