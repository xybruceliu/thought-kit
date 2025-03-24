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

export interface UpdateThoughtRequest {
  thought: Thought;
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
      // Filter out undefined fields but keep nested objects like 'thought'
      const requestData: any = {};
      
      // Always include the thought object if present
      if (request.thought) {
        requestData.thought = request.thought;
      }
      
      // Add the rest of the properties if defined
      if (request.weight !== undefined) requestData.weight = request.weight;
      if (request.saliency !== undefined) requestData.saliency = request.saliency;
      if (request.persistent !== undefined) requestData.persistent = request.persistent;
      if (request.interactivity !== undefined) requestData.interactivity = request.interactivity;
      if (request.content_text !== undefined) requestData.content_text = request.content_text;
      if (request.add_user_comment !== undefined) requestData.add_user_comment = request.add_user_comment;
      
      console.log(`Sending update request for thought ${thoughtId}`, requestData);
      
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

  // Create a memory item
  async createMemory(request: CreateMemoryRequest): Promise<MemoryItem> {
    try {
      const response: AxiosResponse<MemoryItem> = await axios.post(
        `${BASE_URL}/memories/`,
        request
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