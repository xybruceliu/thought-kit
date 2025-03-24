import numpy as np
from typing import List, Optional, Union

def cosine_similarity(embedding1: Optional[List[float]], embedding2: Optional[List[float]]) -> float:
    """
    Calculate the cosine similarity between two embeddings.
    
    Args:
        embedding1: First embedding vector as a list of floats
        embedding2: Second embedding vector as a list of floats
        
    Returns:
        Cosine similarity as a float between -1 and 1, where 1 means identical,
        0 means orthogonal, and -1 means opposite. Returns 0 if either embedding is None.
    """
    # Handle None values or empty embeddings
    if embedding1 is None or embedding2 is None:
        return 0.0
    
    if len(embedding1) == 0 or len(embedding2) == 0:
        return 0.0
    
    # Convert to numpy arrays for efficient computation
    vec1 = np.array(embedding1)
    vec2 = np.array(embedding2)
    
    # Calculate dot product
    dot_product = np.dot(vec1, vec2)
    
    # Calculate magnitudes
    magnitude1 = np.linalg.norm(vec1)
    magnitude2 = np.linalg.norm(vec2)
    
    # Avoid division by zero
    if magnitude1 == 0 or magnitude2 == 0:
        return 0.0
    
    # Calculate cosine similarity
    similarity = dot_product / (magnitude1 * magnitude2)
    
    # Ensure the result is within valid range due to potential floating-point errors
    return max(min(similarity, 1.0), -1.0)
