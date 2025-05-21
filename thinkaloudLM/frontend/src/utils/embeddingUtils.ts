/**
 * Utility functions for working with embeddings
 */

/**
 * Compute the cosine similarity between two embedding vectors
 * @param embedding1 First embedding vector
 * @param embedding2 Second embedding vector
 * @returns Similarity score between 0 and 1
 */
export function computeSimilarity(embedding1?: number[], embedding2?: number[]): number {
  // Return 0 if either embedding is missing
  if (!embedding1 || !embedding2) {
    return 0;
  }
  
  // If embeddings have different dimensions, return 0
  if (embedding1.length !== embedding2.length) {
    return 0;
  }
  
  // Compute dot product
  let dotProduct = 0;
  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
  }
  
  // Compute magnitudes
  let magnitude1 = 0;
  let magnitude2 = 0;
  for (let i = 0; i < embedding1.length; i++) {
    magnitude1 += embedding1[i] * embedding1[i];
    magnitude2 += embedding2[i] * embedding2[i];
  }
  magnitude1 = Math.sqrt(magnitude1);
  magnitude2 = Math.sqrt(magnitude2);
  
  // Compute cosine similarity
  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }
  
  return dotProduct / (magnitude1 * magnitude2);
}

/**
 * Find the most similar thought based on embedding
 * @param targetEmbedding The embedding to compare against
 * @param embeddings Array of embeddings to search through
 * @returns Index of the most similar embedding, or -1 if no valid embeddings
 */
export function findMostSimilar(targetEmbedding?: number[], embeddings?: number[][]): number {
  if (!targetEmbedding || !embeddings || embeddings.length === 0) {
    return -1;
  }
  
  let maxSimilarity = -1;
  let maxIndex = -1;
  
  for (let i = 0; i < embeddings.length; i++) {
    const similarity = computeSimilarity(targetEmbedding, embeddings[i]);
    if (similarity > maxSimilarity) {
      maxSimilarity = similarity;
      maxIndex = i;
    }
  }
  
  return maxIndex;
} 