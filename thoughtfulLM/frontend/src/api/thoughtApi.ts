// API service for ThoughtfulLM
// This file will contain functions for interacting with the backend API
//
// NOTE: API Format Update
// The backend expects a simplified format for generating thoughts:
// - Only requires event_text and event_type

import axios, { AxiosResponse } from 'axios';

// Import types from the types directory
import { Thought } from '../types/thought';
import { EventType } from '../types/event';
import { Memory, MemoryItem } from '../types/memory';

// Base API URL
const BASE_URL = 'http://localhost:8000/api/v1';

// Request types
export interface GenerateThoughtRequest {
  event_text: string;
  event_type: EventType;
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

export interface AddMemoryRequest {
  type: 'LONG_TERM' | 'SHORT_TERM';
  text: string;
}

export interface UpdateThoughtRequest {
  weight?: number;
  saliency?: number;
  persistent?: boolean;
  interactivity?: 'VIEW' | 'COMMENT' | 'EDIT';
  content_text?: string;
  add_user_comment?: string;
}

// API client class
class ThoughtApi {
  // Generate a thought using the ThoughtKit API
  async generateThought(request: GenerateThoughtRequest): Promise<Thought | null> {
    try {
      const response: AxiosResponse<Thought> = await axios.post(
        `${BASE_URL}/thoughts/generate`,
        request
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
      const response: AxiosResponse<Thought | Thought[]> = await axios.post(
        `${BASE_URL}/thoughts/operate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error operating on thought:', error);
      throw this.handleError(error);
    }
  }

  // Update a thought with multiple properties
  async updateThought(thoughtId: string, request: UpdateThoughtRequest): Promise<Thought> {
    try {
      // Only include non-undefined fields in the request
      const requestData = Object.fromEntries(
        Object.entries(request).filter(([_, value]) => value !== undefined)
      );
      
      const response: AxiosResponse<Thought> = await axios.put(
        `${BASE_URL}/thoughts/${thoughtId}`,
        requestData
      );
      return response.data;
    } catch (error) {
      console.error(`Error updating thought ${thoughtId}:`, error);
      throw this.handleError(error);
    }
  }

  // Articulate thoughts into a coherent response
  async articulateThoughts(request: ArticulateThoughtsRequest): Promise<ArticulateThoughtsResponse> {
    try {
      const response: AxiosResponse<ArticulateThoughtsResponse> = await axios.post(
        `${BASE_URL}/thoughts/articulate`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error articulating thoughts:', error);
      throw this.handleError(error);
    }
  }

  // Get all thoughts
  async getAllThoughts(): Promise<Thought[]> {
    try {
      const response: AxiosResponse<Thought[]> = await axios.get(
        `${BASE_URL}/thoughts/`
      );
      return response.data;
    } catch (error) {
      console.error('Error getting all thoughts:', error);
      throw this.handleError(error);
    }
  }

  // Get a thought by ID
  async getThought(thoughtId: string): Promise<Thought> {
    try {
      const response: AxiosResponse<Thought> = await axios.get(
        `${BASE_URL}/thoughts/${thoughtId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting thought with ID ${thoughtId}:`, error);
      throw this.handleError(error);
    }
  }

  // Delete a thought by ID
  async deleteThought(thoughtId: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/thoughts/${thoughtId}`);
    } catch (error) {
      console.error(`Error deleting thought with ID ${thoughtId}:`, error);
      throw this.handleError(error);
    }
  }

  // Add a memory
  async addMemory(request: AddMemoryRequest): Promise<MemoryItem> {
    try {
      const response: AxiosResponse<MemoryItem> = await axios.post(
        `${BASE_URL}/memories/`,
        request
      );
      return response.data;
    } catch (error) {
      console.error('Error adding memory:', error);
      throw this.handleError(error);
    }
  }

  // Get memories by type
  async getMemoriesByType(type?: 'LONG_TERM' | 'SHORT_TERM'): Promise<Memory | MemoryItem[]> {
    try {
      let url = `${BASE_URL}/memories/`;
      if (type) {
        url += `?memory_type=${type}`;
      }
      
      const response: AxiosResponse<Memory | MemoryItem[]> = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(`Error getting memories by type ${type || 'all'}:`, error);
      throw this.handleError(error);
    }
  }

  // Clear all memories
  async clearMemories(): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/memories/`);
    } catch (error) {
      console.error('Error clearing memories:', error);
      throw this.handleError(error);
    }
  }

  // Clear all thoughts
  async clearThoughts(): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/thoughts/`);
    } catch (error) {
      console.error('Error clearing thoughts:', error);
      throw this.handleError(error);
    }
  }

  // Clear all data (thoughts and memories)
  async clearAllData(): Promise<void> {
    try {
      await Promise.all([
        this.clearThoughts(),
        this.clearMemories()
      ]);
    } catch (error) {
      console.error('Error clearing all data:', error);
      throw this.handleError(error);
    }
  }

  // Helper method to handle errors
  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      // Return a more helpful error message when possible
      const errorMessage = error.response?.data?.detail || error.message;
      return new Error(`API Error: ${errorMessage}`);
    }
    return error instanceof Error ? error : new Error('Unknown error occurred');
  }
}

// Create and export a singleton instance
export const thoughtApi = new ThoughtApi();

export default thoughtApi; 