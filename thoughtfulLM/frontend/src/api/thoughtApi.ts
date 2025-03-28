// API service for ThoughtfulLM
// This file will contain functions for interacting with the backend API
//
// NOTE: API Format Update
// The backend expects a simplified format for generating thoughts:
// - Only requires event_text and event_type

import axios, { AxiosResponse, AxiosError } from 'axios';

// Import types from the types directory
import { Thought } from '../types/thought';
import { EventType } from '../types/event';
import { Memory, MemoryItem } from '../types/memory';

// Base API URL - dynamically determine based on environment
const BASE_URL = process.env.NODE_ENV === 'production' 
  ? '/api/v1'  // Use relative URL in production (when served by FastAPI)
  : 'http://localhost:8000/api/v1';  // Use absolute URL in development

// Maximum number of retries for API requests
const MAX_RETRIES = 5;
// Delay between retries (in milliseconds)
const RETRY_DELAY = 500;

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Request types
export interface GenerateThoughtRequest {
  event_text: string;
  event_type: EventType;
  thoughts?: Thought[];
  memory?: Memory;
}

export interface OperateOnThoughtRequest {
  operation: string;
  thoughts: Thought[];
  memory?: Memory;
  options?: {
    [key: string]: any;
  };
}

export interface ArticulateThoughtsRequest {
  thoughts: Thought[];
  memory?: Memory;
}

export interface ArticulateThoughtsResponse {
  response: string;
}

export interface CreateMemoryRequest {
  type: 'LONG_TERM' | 'SHORT_TERM';
  text: string;
}

// API client class
class ThoughtApi {
  // Retry wrapper for API calls
  private async retryRequest<T>(
    requestFn: () => Promise<AxiosResponse<T>>,
    retries = MAX_RETRIES
  ): Promise<AxiosResponse<T>> {
    let lastError: any;
    
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        lastError = error;
        // Only retry on 503 Service Unavailable or network errors
        if (axios.isAxiosError(error) && 
            (error.response?.status === 503 || !error.response)) {
          console.log(`Request failed, retrying (${attempt + 1}/${retries})...`);
          // Wait before retrying
          await delay(RETRY_DELAY * (attempt + 1));
          continue;
        }
        throw error; // For other errors, don't retry
      }
    }
    
    throw lastError; // If we've exhausted all retries
  }

  // Generate a thought using the ThoughtKit API
  async generateThought(request: GenerateThoughtRequest): Promise<Thought | null> {
    try {
      const response = await this.retryRequest<Thought>(() => 
        axios.post(`${BASE_URL}/thoughts/generate`, request)
      );
      return response.data;
    } catch (error) {
      console.error('Error generating thought:', error);
      throw this.handleError(error);
    }
  }

  // Perform an operation on thoughts
  async operateOnThought(request: OperateOnThoughtRequest): Promise<Thought | Thought[]> {
    try {
      const response = await this.retryRequest<Thought | Thought[]>(() => 
        axios.post(`${BASE_URL}/thoughts/operate`, request)
      );
      return response.data;
    } catch (error) {
      console.error('Error operating on thought:', error);
      throw this.handleError(error);
    }
  }

  // Articulate thoughts into a coherent response
  async articulateThoughts(request: ArticulateThoughtsRequest): Promise<ArticulateThoughtsResponse> {
    try {
      const response = await this.retryRequest<ArticulateThoughtsResponse>(() => 
        axios.post(`${BASE_URL}/thoughts/articulate`, request)
      );
      return response.data;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      throw this.handleError(error);
    }
  }

  // Create a memory item
  async createMemory(request: CreateMemoryRequest): Promise<MemoryItem> {
    try {
      const response = await this.retryRequest<MemoryItem>(() => 
        axios.post(`${BASE_URL}/memories/`, request)
      );
      return response.data;
    } catch (error) {
      console.error('Error creating memory:', error);
      throw this.handleError(error);
    }
  }
  
  // Error handling 
  private handleError(error: any): Error {
    if (axios.isAxiosError(error) && error.response) {
      // Return the error message from the backend if available
      const errorMessage = error.response.data.detail || 'An error occurred';
      return new Error(errorMessage);
    }
    return new Error('An unexpected error occurred');
  }
}

// Export a singleton instance
export const thoughtApi = new ThoughtApi();

export default thoughtApi; 